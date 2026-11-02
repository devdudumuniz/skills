import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "prepare_publish.py"


def run(*args):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, encoding="utf-8")


class PreparePublish(unittest.TestCase):
    def project(self, td):
        root = Path(td)
        (root / "status" / "engine" / "docker").mkdir(parents=True)
        (root / "status" / "engine" / "docker" / "compose.yml").write_text("name: x\n", encoding="utf-8")
        return root

    def test_creates_runbook_env_snippet_and_gitignore_without_printing_token(self):
        with tempfile.TemporaryDirectory() as td:
            root = self.project(td)
            r = run(str(root), "--domain", "status.cliente.com.br", "--proxy-ip", "192.168.1.50", "--host-ip", "192.168.20.254", "--generate-token")
            self.assertEqual(r.returncode, 0, r.stderr)
            info = json.loads(r.stdout)
            self.assertTrue(info["token_generated"])
            env = (root / "status/publicar/publicar.env").read_text(encoding="utf-8")
            token = [l for l in env.splitlines() if l.startswith("STATUS_PROXY_TOKEN=")][0].split("=", 1)[1]
            self.assertGreaterEqual(len(token), 32)
            self.assertNotIn(token, r.stdout + r.stderr)                         # o segredo nunca é impresso
            self.assertIn("STATUS_BIND=192.168.20.254", env)
            self.assertIn(token, (root / "status/publicar/npm-advanced.conf").read_text(encoding="utf-8"))
            self.assertNotIn(token, (root / "status/publicar/PUBLICAR.md").read_text(encoding="utf-8"))
            self.assertNotIn(token, (root / "status/publicar/publicar.env.example").read_text(encoding="utf-8"))
            gi = (root / ".gitignore").read_text(encoding="utf-8")
            self.assertIn("status/publicar/publicar.env", gi)
            self.assertIn("status/publicar/npm-advanced.conf", gi)
            md = (root / "status/publicar/PUBLICAR.md").read_text(encoding="utf-8")
            for needle in ("status.cliente.com.br", "http://192.168.20.254:8780", "Access List", "--pid-file"):
                self.assertIn(needle, md)

    def test_refuses_all_interfaces_and_missing_install(self):
        with tempfile.TemporaryDirectory() as td:
            root = self.project(td)
            self.assertNotEqual(run(str(root), "--domain", "a.b.c", "--proxy-ip", "192.168.1.50", "--host-ip", "0.0.0.0").returncode, 0)
        with tempfile.TemporaryDirectory() as td:
            self.assertEqual(run(td, "--domain", "a.b.c", "--proxy-ip", "192.168.1.50").returncode, 2)

    def test_placeholder_when_host_ip_is_ambiguous_or_equals_proxy(self):
        with tempfile.TemporaryDirectory() as td:
            root = self.project(td)
            r = run(str(root), "--domain", "a.b.c", "--proxy-ip", "10.255.255.1", "--host-ip", "10.255.255.1")
            self.assertEqual(r.returncode, 0, r.stderr)
            info = json.loads(r.stdout)
            self.assertTrue(info["needs_host_ip_choice"] or info["host_ip"] not in (None, "10.255.255.1"))
            self.assertNotIn("STATUS_BIND=10.255.255.1", (root / "status/publicar/publicar.env.example").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
