import { createContext, useContext, useState, ReactNode } from "react";
import { AgentSkill, Role } from "../types";
import { AGENT_SKILLS } from "../data/skillsData";

interface ProjectContextType {
  role: Role;
  setRole: (r: Role) => void;
  skills: AgentSkill[];
  addSkill: (newSkill: AgentSkill) => void;
  deleteSkill: (id: string) => void;
  toggleInstallSkill: (id: string) => void;
  toggleFavoriteSkill: (id: string) => void;
  activeTestSkillId: string | null;
  setActiveTestSkillId: (id: string | null) => void;
  recordEvent: (action: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("ADMIN");
  const [skills, setSkills] = useState<AgentSkill[]>(() => {
    try {
      const rawFavs = localStorage.getItem("dm_skills_favorites");
      if (rawFavs) {
        const favIds = new Set<string>(JSON.parse(rawFavs));
        return AGENT_SKILLS.map((s) => ({
          ...s,
          isFavorite: favIds.has(s.id),
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return AGENT_SKILLS.map((s) => ({
      ...s,
      isFavorite: s.id === "discord-playbooks" || s.id === "devops-delivery",
    }));
  });

  const [activeTestSkillId, setActiveTestSkillId] = useState<string | null>("web-design");

  const addSkill = (newSkill: AgentSkill) => {
    setSkills((prev) => [newSkill, ...prev]);
  };

  const deleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleInstallSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, installed: !s.installed } : s))
    );
  };

  const toggleFavoriteSkill = (id: string) => {
    setSkills((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
      try {
        const favIds = updated.filter((s) => s.isFavorite).map((s) => s.id);
        localStorage.setItem("dm_skills_favorites", JSON.stringify(favIds));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const recordEvent = (action: string) => {
    console.log(`[DM Skills] ${action}`);
  };

  return (
    <ProjectContext.Provider
      value={{
        role,
        setRole,
        skills,
        addSkill,
        deleteSkill,
        toggleInstallSkill,
        toggleFavoriteSkill,
        activeTestSkillId,
        setActiveTestSkillId,
        recordEvent,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
