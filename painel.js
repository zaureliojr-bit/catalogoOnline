const API = "https://script.google.com/macros/s/AKfycbwgV_M7WiFOZ_a_h6_mnFBpaxYygh0XiTY2LFuu2Gs3B9C6-YRQSczIMCsYiWoHrIhSnw/exec";

let todosPedidos = [];
let periodoAtual = "hoje";

// 🚀 CARREGAR PEDIDOS
async function carregarPainel(){
  try{
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({ acao: "listar" })
    });
    todosPedidos = await res.json();

    document.getElementById("status").innerText = "🟢 Online · Painel";
    render();

  }catch(e){
    document.getElementById("status").innerText = "🔴 Erro ao carregar";
  }
}

// 🛡️ ESCAPAR HTML
function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 📅 FILTRAR PERÍODO
function filtrarPeriodo(periodo, evt){

  periodoAtual = periodo;

  document.querySelectorAll(".filtros button")
    .forEach(btn => btn.classList.remove("ativo"));

  if(evt) evt.currentTarget.classList.add("ativo");

  render();
}

function pedidosFiltrados(){
  if(periodoAtual === "tudo") return todosPedidos;

  let limite = new Date();

  if(periodoAtual === "hoje"){
    limite.setHours(0, 0, 0, 0);
  }else if(periodoAtual === "7"){
    limite.setDate(limite.getDate() - 7);
  }else if(periodoAtual === "30"){
    limite.setDate(limite.getDate() - 30);
  }

  return todosPedidos.filter(p => new Date(p.DataHora) >= limite);
}

function formatarData(iso){
  let d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
}

// 🎨 RENDER
function render(){

  let lista = pedidosFiltrados();

  // 📈 ESTATÍSTICAS
  let totalPedidos = lista.length;
  let faturamento = lista.reduce((soma, p) => soma + Number(p.Total || 0), 0);

  document.getElementById("statPedidos").innerText = totalPedidos;
  document.getElementById("statFaturamento").innerText = "R$ " + faturamento.toFixed(2).replace(".", ",");

  // 🏆 MAIS VENDIDOS
  let ranking = {};

  lista.forEach(p => {
    (p.Itens || []).forEach(item => {
      if(!ranking[item.nome]) ranking[item.nome] = { qtd: 0, receita: 0 };
      ranking[item.nome].qtd += Number(item.qtd || 0);
      ranking[item.nome].receita += Number(item.qtd || 0) * Number(item.preco || 0);
    });
  });

  let rankingArr = Object.keys(ranking)
    .map(nome => ({ nome, qtd: ranking[nome].qtd, receita: ranking[nome].receita }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 10);

  let medalhas = ["🥇", "🥈", "🥉"];
  let containerRanking = document.getElementById("ranking");

  containerRanking.innerHTML = rankingArr.length
    ? rankingArr.map((item, i) => `
        <div class="ranking-item">
          <span class="ranking-pos">${medalhas[i] || (i + 1) + "º"}</span>
          <span class="ranking-nome">${escapeHtml(item.nome)}</span>
          <span class="ranking-qtd">${item.qtd}x</span>
          <span class="ranking-receita">R$ ${item.receita.toFixed(2).replace(".", ",")}</span>
        </div>
      `).join("")
    : `<p class="vazio">Nenhum pedido no período.</p>`;

  // 🧾 HISTÓRICO
  let historicoOrdenado = [...lista].sort((a, b) => new Date(b.DataHora) - new Date(a.DataHora));
  let containerHistorico = document.getElementById("historico");

  containerHistorico.innerHTML = historicoOrdenado.length
    ? historicoOrdenado.map(p => `
        <div class="historico-item">
          <div class="historico-topo">
            <b>#${escapeHtml(p.Numero)}</b>
            <span class="historico-origem">${p.Origem === "balcao" ? "🍽️ Balcão" : "🌐 Site"}</span>
            <span class="historico-total">R$ ${Number(p.Total || 0).toFixed(2).replace(".", ",")}</span>
          </div>
          <div class="historico-meta">
            ${formatarData(p.DataHora)}${p.Local ? " • " + escapeHtml(p.Local) : ""}${p.Cliente ? " • " + escapeHtml(p.Cliente) : ""}
          </div>
          <div class="historico-itens">
            ${(p.Itens || []).map(i => `${i.qtd}x ${escapeHtml(i.nome)}`).join(", ")}
          </div>
        </div>
      `).join("")
    : `<p class="vazio">Nenhum pedido no período.</p>`;
}

// 🚀 START
carregarPainel();
