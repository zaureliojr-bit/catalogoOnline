const API = "https://script.google.com/macros/s/AKfycbwgV_M7WiFOZ_a_h6_mnFBpaxYygh0XiTY2LFuu2Gs3B9C6-YRQSczIMCsYiWoHrIhSnw/exec";
const NUMERO_LOJA = "5532991933822";

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinhoBalcao")) || [];

// 🚀 CARREGAR PRODUTOS
async function carregar(){
  try{
    const res = await fetch(API);
    produtos = await res.json();

    document.getElementById("status").innerText = "🟢 Online · Balcão";

    render(produtos);
    atualizarCarrinho();

  }catch(e){
    document.getElementById("status").innerText = "🔴 Erro";
  }
}

// 🛡️ ESCAPAR HTML (evita XSS vindo dos dados da planilha)
function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 🎨 RENDER PRODUTOS
function render(lista){

  let container = document.getElementById("produtos");
  if(!container) return;

  container.innerHTML = "";

  lista.forEach(p=>{

    let item = carrinho.find(i=>i.codigo === p.codigo);
    let qtd = item ? item.qtd : 0;

    let botao = qtd > 0
      ? `<div class="fab-stepper">
           <button onclick="menos('${p.codigo}')">−</button>
           <span>${qtd}</span>
           <button onclick="add('${p.codigo}')">+</button>
         </div>`
      : `<button class="fab-add" onclick="add('${p.codigo}')">+</button>`;

    container.innerHTML += `
      <div class="card">
        <div class="card-media">
          <img src="${escapeHtml(p.imagem || 'https://via.placeholder.com/150')}">
          ${botao}
        </div>

        <div class="card-info">
          <b>${escapeHtml(p.nome)}</b>
          <span class="preco">R$ ${Number(p.preco).toFixed(2)}</span>
        </div>
      </div>
    `;
  });
}

// ➕ ADICIONAR
function add(codigo){

  let produto = produtos.find(p=>String(p.codigo) === String(codigo));
  if(!produto) return;

  let item = carrinho.find(p=>String(p.codigo) === String(codigo));

  if(item){
    item.qtd++;
  }else{
    carrinho.push({
      codigo: produto.codigo,
      nome: produto.nome,
      preco: Number(produto.preco),
      qtd: 1
    });
  }

  salvar();
}

// ➖ REMOVER
function menos(codigo){

  let item = carrinho.find(p=>String(p.codigo) === String(codigo));
  if(!item) return;

  item.qtd--;

  if(item.qtd <= 0){
    carrinho = carrinho.filter(p=>String(p.codigo) !== String(codigo));
  }

  salvar();
}

// 💾 SALVAR
function salvar(){
  localStorage.setItem("carrinhoBalcao", JSON.stringify(carrinho));
  atualizarCarrinho();
}

// 🔄 ATUALIZAR CARRINHO
function atualizarCarrinho(){

  let total = 0;
  let qtd = 0;

  carrinho.forEach(p=>{
    total += p.preco * p.qtd;
    qtd += p.qtd;
  });

  document.getElementById("qtdTop").innerText = `(${qtd})`;
  document.getElementById("totalTop").innerText = `R$ ${total.toFixed(2)}`;

  document.getElementById("qtd").innerText = `(${qtd})`;
  document.getElementById("total").innerText = `Total: R$ ${total.toFixed(2)}`;

  renderizarCarrinho();
  render(produtos);
}

// 🛒 RENDER CARRINHO
function renderizarCarrinho(){

  let container = document.getElementById("itens");
  if(!container) return;

  container.innerHTML = "";

  carrinho.forEach(p=>{
    container.innerHTML += `
      <div class="item">
        ${escapeHtml(p.nome)} x${p.qtd}
      </div>
    `;
  });
}

// 🛒 ABRIR / FECHAR
function toggleCarrinho(){
  document.getElementById("carrinho").classList.toggle("aberto");
}

// 🍽️ BALCÃO / MESA
function toggleLocal(){
  let local = document.getElementById("local")?.value || "";
  document.getElementById("boxMesa").style.display = local === "Mesa" ? "block" : "none";
}

// 🔎 BUSCAR
function buscar(){
  let termo = document.getElementById("busca").value.toLowerCase();
  render(produtos.filter(p => (p.nome || "").toLowerCase().includes(termo)));
}

// 🔎 BUSCAR AO PRESSIONAR ENTER
document.getElementById("busca").addEventListener("keydown", (e) => {
  if(e.key === "Enter") buscar();
});

// 📂 FILTRAR POR CATEGORIA
function filtrarCategoria(categoria, evt){

  document.querySelectorAll(".filtros button")
    .forEach(btn => btn.classList.remove("ativo"));

  if(evt) evt.currentTarget.classList.add("ativo");

  if(categoria === "todas"){
    render(produtos);
    return;
  }

  render(produtos.filter(p => p.categoria === categoria));
}

// 🧹 LIMPAR
function limparCarrinho(){
  carrinho = [];
  salvar();
}

// 📲 ENVIAR PEDIDO (balcão/mesa)
function enviarPedido(){

  if(carrinho.length === 0){
    alert("Carrinho vazio");
    return;
  }

  let local = document.getElementById("local")?.value || "";
  let mesa = document.getElementById("mesa")?.value.trim() || "";
  let clienteNome = document.getElementById("clienteNome")?.value.trim() || "";
  let observacao = document.getElementById("observacaoBalcao")?.value.trim() || "";

  if(!local){
    alert("Selecione Balcão ou Mesa");
    return;
  }

  if(local === "Mesa" && !mesa){
    alert("Informe o número da mesa");
    return;
  }

  let total = 0;
  carrinho.forEach(p=> total += p.preco * p.qtd);

  let numeroPedido = Date.now().toString().slice(-6);

  let agora = new Date();
  let data = agora.toLocaleDateString();
  let hora = agora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  let texto = `🧾 *PEDIDO BALCÃO/MESA #${numeroPedido}*\n`;
  texto += `🏪 *Cafofo da Sissi*\n`;
  texto += `📅 ${data} • ${hora}\n\n`;

  texto += "━━━━━━━━━━━━━━━\n";
  texto += "🍔 *ITENS*\n\n";

  carrinho.forEach(p=>{
    texto += `➤ *${p.nome}*\n`;
    texto += `   Qtd: ${p.qtd} | R$ ${p.preco.toFixed(2)}\n\n`;
  });

  texto += "━━━━━━━━━━━━━━━\n";
  texto += `💰 *TOTAL: R$ ${total.toFixed(2).replace(".", ",")}*\n`;
  texto += "━━━━━━━━━━━━━━━\n\n";

  texto += "📍 *LOCAL*\n";
  texto += local === "Mesa" ? `• Mesa ${mesa}\n` : "• Balcão\n";

  if(clienteNome){
    texto += `• Cliente: ${clienteNome}\n`;
  }

  if(observacao){
    texto += "\n📝 *OBSERVAÇÕES*\n";
    texto += `${observacao}\n`;
  }

  texto += "\n━━━━━━━━━━━━━━━\n";
  texto += "🚀 Pedido enviado pelo balcão";

  // 🚀 ABRE WHATSAPP (número da loja)
  window.open("https://wa.me/" + NUMERO_LOJA + "?text=" + encodeURIComponent(texto));

  // ⏱️ PEQUENO DELAY PRA UX
  setTimeout(() => {

    // 🧹 LIMPA CARRINHO
    limparCarrinho();

    // 🔄 RESET CAMPOS
    document.getElementById("local").value = "";
    document.getElementById("mesa").value = "";
    document.getElementById("clienteNome").value = "";
    document.getElementById("observacaoBalcao").value = "";
    document.getElementById("boxMesa").style.display = "none";

  }, 500);
}

// 🚀 START
carregar();
