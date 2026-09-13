import { GitWizardRequest, GitWizardResponse } from "@/types";

export interface GitDisasterScenario {
  id: string;
  title: string;
  triggerKeywords: string[];
  summary: string;
  whyThisWorks: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    command: string;
    explanation: string;
    isDangerous?: boolean;
    dangerReason?: string;
    verificationCommand?: string;
  }>;
  emergencyFallback: string;
}

export const GIT_SCENARIOS: GitDisasterScenario[] = [
  {
    id: "committed-to-main",
    title: "Committed to 'main' instead of a new feature branch",
    triggerKeywords: ["main", "master", "wrong branch", "committed to main", "instead of feature"],
    summary: "Move recent unpushed commits from 'main' to a new feature branch, then reset 'main' back to origin/main.",
    whyThisWorks: "Creating a branch from the current HEAD carries all commits over. Resetting main rewinds the pointer without touching your new branch.",
    steps: [
      {
        stepNumber: 1,
        title: "Create and switch to your intended feature branch",
        command: "git branch feature/my-new-feature && git switch feature/my-new-feature",
        explanation: "Creates your feature branch pointing to your recent commits so no work is lost.",
        verificationCommand: "git branch --show-current",
      },
      {
        stepNumber: 2,
        title: "Switch back to main",
        command: "git switch main",
        explanation: "Switches back to main so you can safely reset it.",
      },
      {
        stepNumber: 3,
        title: "Reset local main back to remote origin/main",
        command: "git reset --hard origin/main",
        explanation: "Aligns your local main branch with the remote repository clean state.",
        isDangerous: true,
        dangerReason: "Discards commits on 'main' (which are now safely preserved in your feature branch).",
        verificationCommand: "git status",
      },
      {
        stepNumber: 4,
        title: "Switch back to your feature branch to continue working",
        command: "git switch feature/my-new-feature",
        explanation: "You are now on your feature branch with all commits intact.",
      },
    ],
    emergencyFallback: "If you made a mistake, run 'git reflog' to find your commit SHA and 'git reset --hard <SHA>' to restore.",
  },
  {
    id: "committed-secret",
    title: "Committed sensitive secrets / API keys / passwords to git",
    triggerKeywords: ["secret", "api key", "password", "token", "credential", "env", "private key"],
    summary: "Remove the sensitive file from Git tracking, uncommit it safely, and add it to .gitignore.",
    whyThisWorks: "Soft resetting keeps your modified code in working directory while removing the commit from Git history.",
    steps: [
      {
        stepNumber: 1,
        title: "Undo the last commit while keeping your file edits",
        command: "git reset --soft HEAD~1",
        explanation: "Uncommits the secret but keeps your working files intact so you don't lose code.",
        verificationCommand: "git status",
      },
      {
        stepNumber: 2,
        title: "Unstage the file containing the secret",
        command: "git restore --staged .env.local",
        explanation: "Removes the secret file from the staging area.",
      },
      {
        stepNumber: 3,
        title: "Add the secret file to .gitignore",
        command: 'echo ".env*.local" >> .gitignore && git add .gitignore',
        explanation: "Ensures Git never tracks this secret file in future commits.",
      },
      {
        stepNumber: 4,
        title: "Commit your remaining safe changes",
        command: 'git commit -m "Commit safe changes excluding credentials"',
        explanation: "Creates a clean commit without sensitive secrets.",
        verificationCommand: "git log -n 1 --stat",
      },
    ],
    emergencyFallback: "If you already pushed the secret to GitHub, rotate the API key immediately and use 'git-filter-repo' or BFG Repo-Cleaner to scrub git history.",
  },
  {
    id: "deleted-branch",
    title: "Accidentally deleted a branch with unmerged work",
    triggerKeywords: ["deleted branch", "branch deleted", "lost branch", "branch -D", "restore branch"],
    summary: "Recover a deleted local branch using Git's reference log (reflog).",
    whyThisWorks: "Git never deletes commits immediately; orphaned branch commits stay in reflog for at least 30 to 90 days.",
    steps: [
      {
        stepNumber: 1,
        title: "Find the commit SHA of the deleted branch in reflog",
        command: "git reflog -n 20",
        explanation: "Lists recent HEAD movements. Look for the last commit on your deleted branch (e.g., HEAD@{3}: commit: Fix auth bug).",
      },
      {
        stepNumber: 2,
        title: "Recreate the deleted branch from the reflog SHA",
        command: "git checkout -b <branch-name> <commit-sha>",
        explanation: "Creates a new branch pointing directly to the tip of your lost work.",
        verificationCommand: "git log -n 3",
      },
    ],
    emergencyFallback: "Run 'git fsck --lost-found' if reflog has expired to inspect dangling commit objects.",
  },
  {
    id: "undo-hard-reset",
    title: "Accidentally ran 'git reset --hard' and lost code",
    triggerKeywords: ["reset --hard", "hard reset", "lost work", "undid commits", "overwritten code"],
    summary: "Rescue commits discarded by 'git reset --hard' through git reflog.",
    whyThisWorks: "A hard reset only moves the branch pointer. The commits themselves remain in Git's object store and reflog.",
    steps: [
      {
        stepNumber: 1,
        title: "Inspect reflog to locate state before the hard reset",
        command: "git reflog -n 15",
        explanation: "Identify the line right before 'HEAD@{0}: reset: moving to...'. Note its SHA or HEAD@{1}.",
      },
      {
        stepNumber: 2,
        title: "Restore your working tree back to the pre-reset commit",
        command: "git reset --hard HEAD@{1}",
        explanation: "Restores your branch and files exactly to the state prior to the mistake.",
        isDangerous: true,
        dangerReason: "Modifies working directory files back to the previous snapshot.",
        verificationCommand: "git log -n 5 --oneline",
      },
    ],
    emergencyFallback: "To inspect without resetting, run 'git branch rescue-branch HEAD@{1}' to inspect safely in a new branch.",
  },
  {
    id: "detached-head",
    title: "In 'Detached HEAD' state and committed changes",
    triggerKeywords: ["detached head", "detached", "you are in 'detached head' state", "commit on detached"],
    summary: "Save commits created in a detached HEAD state to a permanent branch.",
    whyThisWorks: "Detached HEAD commits are valid commits; assigning a branch name prevents them from being garbage collected.",
    steps: [
      {
        stepNumber: 1,
        title: "Create a new branch from your current detached HEAD",
        command: "git branch rescue-detached-work",
        explanation: "Pins your detached commits to a brand new branch name.",
      },
      {
        stepNumber: 2,
        title: "Switch to your main or target branch",
        command: "git switch main",
        explanation: "Returns to your main development branch.",
      },
      {
        stepNumber: 3,
        title: "Merge or cherry-pick the rescued work",
        command: "git merge rescue-detached-work",
        explanation: "Integrates your detached work into main.",
        verificationCommand: "git log -n 3 --oneline",
      },
    ],
    emergencyFallback: "Use 'git reflog' if you switch branches before naming the detached commit.",
  },
  {
    id: "merge-conflict-abort",
    title: "Stuck in a broken merge or rebase and want to abort",
    triggerKeywords: ["merge conflict", "rebase", "stuck in merge", "abort merge", "abort rebase", "conflict"],
    summary: "Safely abort an in-progress merge or rebase and return to a clean state.",
    whyThisWorks: "Git provides built-in atomic abort mechanisms that revert all conflict markers cleanly.",
    steps: [
      {
        stepNumber: 1,
        title: "Abort in-progress merge (if merging)",
        command: "git merge --abort",
        explanation: "Reverts your working directory to the state before 'git merge' was run.",
      },
      {
        stepNumber: 2,
        title: "Abort in-progress rebase (if rebasing)",
        command: "git rebase --abort",
        explanation: "Restores your original branch state before 'git rebase' was started.",
        verificationCommand: "git status",
      },
    ],
    emergencyFallback: "If Git is stuck in an ambiguous state, run 'git status' to check if .git/MERGE_HEAD or .git/rebase-apply exists.",
  },
];

export function diagnoseGitDisaster(request: GitWizardRequest): GitWizardResponse {
  const query = `${request.scenario || ""} ${request.customDescription || ""} ${request.gitStatusOutput || ""}`.toLowerCase();

  for (const scenario of GIT_SCENARIOS) {
    if (
      (request.scenario && scenario.id === request.scenario) ||
      scenario.triggerKeywords.some((kw) => query.includes(kw.toLowerCase()))
    ) {
      return {
        scenarioTitle: scenario.title,
        summary: scenario.summary,
        whyThisWorks: scenario.whyThisWorks,
        steps: scenario.steps,
        emergencyFallback: scenario.emergencyFallback,
        confidence: "high",
      };
    }
  }

  // Generic fallback
  return {
    scenarioTitle: "Git Safety & State Inspection",
    summary: "Diagnose repository status and inspect reference logs without altering your working tree.",
    whyThisWorks: "Checking status and reflog are completely non-destructive read operations.",
    steps: [
      {
        stepNumber: 1,
        title: "Check current Git status",
        command: "git status",
        explanation: "Inspects modified files, untracked items, and active branch state.",
      },
      {
        stepNumber: 2,
        title: "View recent Git history log",
        command: "git log -n 5 --oneline --graph",
        explanation: "Shows recent commit graph and where HEAD is pointing.",
      },
      {
        stepNumber: 3,
        title: "Inspect reference logs for recent movements",
        command: "git reflog -n 10",
        explanation: "Shows all previous positions of HEAD to identify lost commits.",
      },
    ],
    emergencyFallback: "Before running any destructive commands, create a backup copy of your repository directory.",
    confidence: "medium",
  };
}
