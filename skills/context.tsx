import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AgentSkillSuite, AgentSkill, BundledSkill, SkillTestCase, SkillTestRunResult } from "./types";
import { AGENT_SUITES, suiteToAgentSkill } from "./data";
import { AGENT_SKILLS } from "../src/data/skillsData";

interface SkillsContextType {
  suites: AgentSkillSuite[];
  selectedSuite: AgentSkillSuite | null;
  setSelectedSuite: (suite: AgentSkillSuite | null) => void;
  skills: AgentSkill[];
  activeTestSkillId: string | null;
  setActiveTestSkillId: (id: string | null) => void;
  toggleInstallSuite: (suiteId: string) => void;
  toggleFavoriteSuite: (suiteId: string) => void;
  toggleInstallSkill: (skillId: string) => void;
  toggleFavoriteSkill: (skillId: string) => void;
  addCustomSuite: (suite: AgentSkillSuite) => void;
  addSkill: (skill: AgentSkill) => void;
  deleteSkill: (id: string) => void;
  getSuiteById: (id: string) => AgentSkillSuite | undefined;
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export function SkillsProvider({ children }: { children: ReactNode }) {
  // Load favorites & installed from local storage
  const [suites, setSuites] = useState<AgentSkillSuite[]>(() => {
    try {
      const rawFavs = localStorage.getItem("deda_skills_favorites_suites") ?? localStorage.getItem("dm_skills_favorites_suites");
      const rawInstalled = localStorage.getItem("deda_skills_installed_suites") ?? localStorage.getItem("dm_skills_installed_suites");
      const favIds = rawFavs ? new Set<string>(JSON.parse(rawFavs)) : null;
      const installedIds = rawInstalled !== null ? new Set<string>(JSON.parse(rawInstalled)) : null;

      return AGENT_SUITES.map((s) => ({
        ...s,
        isFavorite: favIds !== null ? favIds.has(s.id) : (s.isFavorite ?? false),
        installed: installedIds !== null ? installedIds.has(s.id) : s.installed,
      }));
    } catch (e) {
      console.error(e);
    }
    return AGENT_SUITES;
  });

  const [skills, setSkills] = useState<AgentSkill[]>(() => {
    try {
      const rawFavs = localStorage.getItem("deda_skills_favorites") ?? localStorage.getItem("dm_skills_favorites");
      const rawInst = localStorage.getItem("deda_skills_installed") ?? localStorage.getItem("dm_skills_installed");
      const favIds = rawFavs ? new Set<string>(JSON.parse(rawFavs)) : null;
      const instIds = rawInst !== null ? new Set<string>(JSON.parse(rawInst)) : null;

      return AGENT_SKILLS.map((s) => ({
        ...s,
        isFavorite: favIds !== null ? favIds.has(s.id) : (s.id === "discord-playbooks" || s.id === "devops-delivery"),
        installed: instIds !== null ? instIds.has(s.id) : s.installed,
      }));
    } catch (e) {
      console.error(e);
    }
    return AGENT_SKILLS.map((s) => ({
      ...s,
      isFavorite: s.id === "discord-playbooks" || s.id === "devops-delivery",
    }));
  });

  const [selectedSuite, setSelectedSuite] = useState<AgentSkillSuite | null>(null);
  const [activeTestSkillId, setActiveTestSkillId] = useState<string | null>("web-design");

  const toggleInstallSuite = (suiteId: string) => {
    setSuites((prev) => {
      const updated = prev.map((s) => (s.id === suiteId ? { ...s, installed: !s.installed } : s));
      try {
        const installedIds = updated.filter((s) => s.installed).map((s) => s.id);
        localStorage.setItem("deda_skills_installed_suites", JSON.stringify(installedIds));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    if (selectedSuite && selectedSuite.id === suiteId) {
      setSelectedSuite((prev) => (prev ? { ...prev, installed: !prev.installed } : null));
    }
  };

  const toggleFavoriteSuite = (suiteId: string) => {
    setSuites((prev) => {
      const updated = prev.map((s) => (s.id === suiteId ? { ...s, isFavorite: !s.isFavorite } : s));
      try {
        const favIds = updated.filter((s) => s.isFavorite).map((s) => s.id);
        localStorage.setItem("deda_skills_favorites_suites", JSON.stringify(favIds));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    if (selectedSuite && selectedSuite.id === suiteId) {
      setSelectedSuite((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const toggleInstallSkill = (skillId: string) => {
    setSkills((prev) => {
      const updated = prev.map((s) => (s.id === skillId ? { ...s, installed: !s.installed } : s));
      try {
        const instIds = updated.filter((s) => s.installed).map((s) => s.id);
        localStorage.setItem("deda_skills_installed", JSON.stringify(instIds));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const toggleFavoriteSkill = (skillId: string) => {
    setSkills((prev) => {
      const updated = prev.map((s) => (s.id === skillId ? { ...s, isFavorite: !s.isFavorite } : s));
      try {
        const favIds = updated.filter((s) => s.isFavorite).map((s) => s.id);
        localStorage.setItem("deda_skills_favorites", JSON.stringify(favIds));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const addCustomSuite = (newSuite: AgentSkillSuite) => {
    setSuites((prev) => [newSuite, ...prev]);
  };

  const addSkill = (newSkill: AgentSkill) => {
    setSkills((prev) => [newSkill, ...prev]);
  };

  const deleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const getSuiteById = (id: string) => {
    return suites.find((s) => s.id === id);
  };

  return (
    <SkillsContext.Provider
      value={{
        suites,
        selectedSuite,
        setSelectedSuite,
        skills,
        activeTestSkillId,
        setActiveTestSkillId,
        toggleInstallSuite,
        toggleFavoriteSuite,
        toggleInstallSkill,
        toggleFavoriteSkill,
        addCustomSuite,
        addSkill,
        deleteSkill,
        getSuiteById,
      }}
    >
      {children}
    </SkillsContext.Provider>
  );
}

export function useSkills() {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error("useSkills must be used within a SkillsProvider");
  }
  return context;
}
