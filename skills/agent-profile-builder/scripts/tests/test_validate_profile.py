"""Testes de regressao para o validador estatico de perfis de agente."""

from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from validate_profile import validate_profile_data, validate_profile_file  # noqa: E402

EXAMPLE_PROFILE_PATH = SCRIPTS_DIR.parent / "assets" / "agent-profile.example.json"


class ValidateProfileTests(unittest.TestCase):
    def setUp(self) -> None:
        self.base_profile = json.loads(EXAMPLE_PROFILE_PATH.read_text(encoding="utf-8"))

    def test_example_profile_file_passes(self) -> None:
        ok, errors = validate_profile_file(EXAMPLE_PROFILE_PATH)
        self.assertTrue(ok, f"Perfil de exemplo deveria passar, mas retornou: {errors}")
        self.assertEqual(errors, [])

    def test_rejects_allow_default_policy(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["permissions"]["default_policy"] = "allow"
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("default_policy" in err for err in errors))

    def test_rejects_prompt_enforcement_layer(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["permissions"]["enforcement_layer"] = "prompt"
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("enforcement_layer" in err for err in errors))

    def test_rejects_hardcoded_secret_or_url_credentials(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["mission"] = "Usar chave sk-testsecret1234567890 para consultar API"
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("API key" in err or "credenciais" in err for err in errors))

        profile_url = copy.deepcopy(self.base_profile)
        profile_url["tools"][0]["description"] = "Conecta em https://admin:superpass@internal.local/api"
        ok_url, errors_url = validate_profile_data(profile_url)
        self.assertFalse(ok_url)
        self.assertTrue(any("URL" in err for err in errors_url))

    def test_rejects_secret_field_name(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["tools"][0]["api_key"] = "plain-secret-value"
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("api_key" in err for err in errors))

    def test_rejects_missing_memory_isolation_or_unauthorized_retrieval(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["memory"]["scope"] = "global-shared"
        profile["memory"]["authorized_retrieval_only"] = False
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("memory.scope" in err for err in errors))
        self.assertTrue(any("authorized_retrieval_only" in err for err in errors))

    def test_rejects_unredacted_logs_or_missing_human_fallback(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["execution_loop"]["tracing_redacted_logs"] = False
        profile["execution_loop"]["human_fallback"] = False
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("tracing_redacted_logs" in err for err in errors))
        self.assertTrue(any("human_fallback" in err for err in errors))

    def test_rejects_missing_execution_stage(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["execution_loop"]["stages"] = ["request", "tool", "respond"]
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("execution_loop.stages" in err for err in errors))

    def test_rejects_undeclared_allowed_tool(self) -> None:
        profile = copy.deepcopy(self.base_profile)
        profile["permissions"]["allowed_tools"].append("ghost_tool")
        ok, errors = validate_profile_data(profile)
        self.assertFalse(ok)
        self.assertTrue(any("ghost_tool" in err for err in errors))


if __name__ == "__main__":
    unittest.main()
