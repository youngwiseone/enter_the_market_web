export function allocParticleFromState(fxState) {
  if (fxState.pool.length > 0) return fxState.pool.pop();
  if (fxState.particles.length < fxState.maxParticles) {
    const particle = { active: false };
    fxState.particles.push(particle);
    return particle;
  }
  return null;
}

export function releaseParticleToState(fxState, particle) {
  if (!particle) return;
  particle.active = false;
  fxState.pool.push(particle);
}
