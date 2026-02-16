export function buildGoalCelebrationControllerDeps(params) {
  const {
    state,
    moveFocusOutsideModal,
    isReduceMotion,
    getToolDisplayName
  } = params;

  return {
    state,
    getActiveGoalCelebration: () => state.activeGoalCelebration,
    setActiveGoalCelebration: (value) => {
      state.activeGoalCelebration = value;
    },
    getGoalCelebrationQueue: () => state.goalCelebrationQueue,
    setGoalCelebrationQueue: (queue) => {
      state.goalCelebrationQueue = queue;
    },
    moveFocusOutsideModal,
    isReduceMotion,
    getToolDisplayName
  };
}

export function buildSessionRuntimeDeps(params) {
  return params;
}
