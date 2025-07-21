(async function () {
  console.log("✅ Pekora Trade Enhancer loaded (STAFF version - customized)");
  const res = await fetch("https://raw.githubusercontent.com/kekwami/pekoravalues/refs/heads/main/values.json");
  const data = await res.json();
  const valueMap = new Map(data.map(item => [cleanName(item.Name), item]));
  const style = document.createElement("style");
  style.textContent = `
    .custom-value-tag {
      font-family: Arial, sans-serif;
      margin-top: 4px;
      display: flex;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
    }
    .custom-value-tag .value {
      color: #00e676;
      font-weight: bold;
    }
    .custom-value-tag .demand {
      font-weight: normal;
    }
    .custom-overpay-summary {
      text-align: center;
      font-weight: bold;
      font-size: 15px;
      text-shadow: none;
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);
  function cleanName(name) {
    return name?.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase() || "";
  }
  function getValue(name) {
    return valueMap.get(cleanName(name))?.Value || 0;
  }
  function formatNumber(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  }
  function enhanceCollectiblesPage() {
    if (!location.pathname.includes('/internal/collectibles')) return;
    const cards = document.querySelectorAll('.card.bg-dark');
    cards.forEach(card => {
      const body = card.querySelector('.card-body');
      if (!body || body.querySelector('.custom-value-tag')) return;
      const pTags = body.querySelectorAll('p');
      if (pTags.length < 1) return;
      const nameText = pTags[0].textContent.trim();
      const value = getValue(nameText);
      if (!value) return;
      const valueElem = document.createElement('p');
      valueElem.className = 'mb-0 text-truncate custom-value-tag';
      valueElem.style.color = '#00e676';
      valueElem.style.fontWeight = 'bold';
      valueElem.textContent = `Value: ${formatNumber(value)}`;
      pTags[pTags.length - 1].insertAdjacentElement('afterend', valueElem);
    });
    const totalRAPElem = document.querySelector('p.fw-bolder');
    if (totalRAPElem && !document.querySelector('#total-value-display')) {
      let totalValue = 0;
      document.querySelectorAll('.card.bg-dark').forEach(card => {
        const nameElem = card.querySelector('.card-body p.fw-bolder');
        if (!nameElem) return;
        const val = getValue(nameElem.textContent.trim());
        if (val) totalValue += val;
      });
      const totalValueElem = document.createElement('p');
      totalValueElem.id = 'total-value-display';
      totalValueElem.className = 'fw-bolder';
      totalValueElem.style.color = '#00e676';
      totalValueElem.style.marginTop = '-16.5px';
      totalValueElem.textContent = `Total Value: ${formatNumber(totalValue)}`;
      totalRAPElem.insertAdjacentElement('afterend', totalValueElem);
    }
  }
  function enhanceTrade() {
    const tradeModal = document.querySelector('.col-9');
    if (!tradeModal) return;
    const sections = tradeModal.querySelectorAll('.row.ms-1.mb-4');
    if (sections.length < 2) return;
    const giveTotal = injectValues(sections[0]);
    const receiveTotal = injectValues(sections[1]);
    const overpay = receiveTotal - giveTotal;
    if (!document.querySelector(".custom-overpay-summary")) {
      const summary = document.createElement("div");
      summary.className = "custom-overpay-summary";
      summary.style.color = overpay === 0 ? "#AAAAAA" : (overpay > 0 ? "#00FF00" : "#FF3131");
      summary.textContent = overpay === 0 ? "Fair Trade" : (overpay > 0 ? `+${formatNumber(overpay)}` : `${formatNumber(overpay)}`);
      const breakdown = document.createElement("div");
      breakdown.style.color = "#CCCCCC";
      breakdown.style.fontSize = "12px";
      breakdown.style.marginTop = "3px";
      breakdown.innerHTML = `
        You're offering: <span style="color:#FF7070;">${formatNumber(giveTotal)}</span><br>
        They're offering: <span style="color:#70FF70;">${formatNumber(receiveTotal)}</span>
      `;
      summary.appendChild(breakdown);
      tradeModal.appendChild(summary);
    }
    if (!document.querySelector(".custom-value-tag")) {
      const tip = document.createElement("div");
      tip.textContent = "If values aren’t showing, try refreshing the page!";
      tip.style = "text-align:center;color:#ccc;font-size:12px;margin-top:5px;";
      tradeModal.appendChild(tip);
    }
  }
  function injectValues(sectionElement) {
    const boxes = sectionElement.querySelectorAll(".col-0-2-135");
    let total = 0;
    boxes.forEach(box => {
      const nameElem = box.querySelector(".itemName-0-2-137 a");
      const img = box.querySelector("img");
      if (!nameElem || !img || box.querySelector(".custom-value-tag")) return;
      const itemName = nameElem.textContent.trim();
      const itemData = valueMap.get(cleanName(itemName));
      const val = itemData?.Value || 0;
      total += val;
      const wrapper = document.createElement("div");
      wrapper.className = "custom-value-tag";
      const valDiv = document.createElement("div");
      valDiv.className = "value";
      valDiv.textContent = val ? formatNumber(val) : "N/A";
      wrapper.appendChild(valDiv);
      if (itemData?.Demand) {
        const demandDiv = document.createElement("div");
        demandDiv.className = "demand";
        demandDiv.textContent = itemData.Demand;
        switch (itemData.Demand.toLowerCase()) {
          case "very low": demandDiv.style.color = "#550000"; break;
          case "low": demandDiv.style.color = "#CC0000"; break;
          case "medium": demandDiv.style.color = "#CCCC00"; break;
          case "high": demandDiv.style.color = "#00CC00"; break;
          default: demandDiv.style.color = "#B0B0B0"; break;
        }
        wrapper.appendChild(demandDiv);
      }
      img.insertAdjacentElement("afterend", wrapper);
    });
    return total;
  }
  function hookTradeClicks() {
    document.querySelectorAll("p").forEach(el => {
      if (el.textContent.trim().toLowerCase() === "view details" && !el.dataset.listenerAttached) {
        el.dataset.listenerAttached = "true";
        el.addEventListener("click", () => {
          let tries = 0;
          const interval = setInterval(() => {
            const modal = document.querySelector(".col-9");
            const name = modal?.querySelector(".itemName-0-2-137 a");
            if (modal && name) {
              clearInterval(interval);
              enhanceTrade();
            }
            if (++tries > 20) clearInterval(interval);
          }, 300);
        });
      }
    });
  }
  const observer = new MutationObserver(() => {
    hookTradeClicks();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("load", () => {
    if (location.pathname.includes("/internal/collectibles")) {
      enhanceCollectiblesPage();
    }
  });
})();
