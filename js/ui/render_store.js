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

function renderCraftingStore(container, state, craftItem) {
  const recipes = state.store.crafting || [];
  if (recipes.length === 0) {
    container.textContent = 'No crafting recipes available.';
    return;
  }
  recipes.forEach((recipe) => {
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    const inputs = recipe.input.map((inp) => {
      const item = state.items.find((it) => it.id === inp.id);
      return `${inp.qty}x ${item ? item.name : 'Unknown'}`;
    }).join(' + ');
    const outputItem = state.items.find((it) => it.id === recipe.output.id);
    const outputName = outputItem ? outputItem.name : 'Unknown';
    div.innerHTML = `<strong>${inputs} -> ${recipe.output.qty}x ${outputName}</strong><br>`;
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.value = '1';
    qtyInput.style.width = '50px';
    div.appendChild(qtyInput);
    const craftBtn = document.createElement('button');
    craftBtn.className = 'button';
    craftBtn.textContent = 'Convert';
    craftBtn.onclick = () => {
      const qty = parseInt(qtyInput.value, 10);
      if (Number.isNaN(qty) || qty <= 0) return;
      craftItem(recipe.id, qty);
    };
    div.appendChild(craftBtn);
    container.appendChild(div);
  });
}

export function renderStorePanel(deps) {
  const {
    state,
    currentStoreTab,
    setCurrentStoreTab,
    purchaseCosmetic,
    selectCosmetic,
    craftItem
  } = deps;
  const container = document.getElementById('store-content');
  if (!container) return;
  container.innerHTML = '';
  if (currentStoreTab !== 'cosmetics' && currentStoreTab !== 'crafting') {
    setCurrentStoreTab('cosmetics');
  }
  const activeTab = currentStoreTab === 'crafting' ? 'crafting' : 'cosmetics';
  if (activeTab === 'cosmetics') {
    renderCosmeticsStore(container, state, purchaseCosmetic, selectCosmetic);
  } else {
    renderCraftingStore(container, state, craftItem);
  }
}
