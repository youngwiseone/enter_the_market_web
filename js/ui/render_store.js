function renderCosmeticsStore(container, state, purchaseCosmetic, selectCosmetic) {
  state.store.cosmetics.forEach((item) => {
    const li = document.createElement('li');
    li.style.marginBottom = '4px';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;
    li.appendChild(nameSpan);
    li.appendChild(document.createTextNode(' '));
    if (!item.unlocked) {
      const buyBtn = document.createElement('button');
      buyBtn.className = 'button';
      buyBtn.textContent = `Buy ($${item.price})`;
      buyBtn.onclick = () => {
        purchaseCosmetic(item.id);
      };
      li.appendChild(buyBtn);
    } else {
      const selectBtn = document.createElement('button');
      selectBtn.className = 'button';
      selectBtn.textContent = state.player.theme === item.id ? 'Selected' : 'Select';
      selectBtn.disabled = state.player.theme === item.id;
      selectBtn.onclick = () => {
        selectCosmetic(item.id);
      };
      li.appendChild(selectBtn);
    }
    container.appendChild(li);
  });
}

export function renderStorePanel(deps) {
  const {
    state,
    currentStoreTab,
    setCurrentStoreTab,
    purchaseCosmetic,
    selectCosmetic
  } = deps;
  const container = document.getElementById('store-content');
  if (!container) return;
  container.innerHTML = '';
  if (currentStoreTab !== 'cosmetics') {
    setCurrentStoreTab('cosmetics');
  }
  renderCosmeticsStore(container, state, purchaseCosmetic, selectCosmetic);
}
