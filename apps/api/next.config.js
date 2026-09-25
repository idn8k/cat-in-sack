/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cat-in-sack/shared"],
  // Repo docs already live at CONTEXT.md / docs/ (see CLAUDE.md) — don't let
  // `next dev` scaffold its own AGENTS.md/CLAUDE.md on top of them.
  agentRules: false,
};

export default nextConfig;
