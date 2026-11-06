# Agregados · Lote 18

Aplicativo de celular para os empreiteiros do **Consórcio Universaliza Lote 18** pedirem agregados (areia, pó de pedra, britas, BGS, rachão, solo etc.).

- Instala pelo link, sem loja: Android (Chrome → **Instalar**) e iPhone (Safari → Compartilhar → **Adicionar à Tela de Início**).
- Funciona sem sinal: depois da 1ª abertura com internet (aparece "Funciona sem internet neste celular"), abre, gera a imagem e guarda os pedidos e fotos sem rede; avisa quando der para enviar.
- GPS sem internet: escuta o GPS por até 1 minuto, fica com a melhor leitura e para sozinho ao chegar a ±10 m; um toque usa o ponto atual.
- Localização pelo GPS do celular, até 3 fotos do local e calculadora de cubagem (vala com tubo, área × espessura, caixas e PVs).
- O pedido sai como **imagem** no padrão do Consórcio Universaliza Lote 18, junto com as fotos do local e uma mensagem curta com o link do mapa, para o WhatsApp da coordenação (José Arimateia, +55 11 94154-3604).
- A imagem traz um QR com o código do pedido (formato `AGR3`). A coordenação envia a imagem na aba Gestão do formulário de controle e o pedido é registrado.

## E-mail automático

Quando há sinal, o app também envia cada pedido (imagem + fotos) para jose.arimateia@lote18.com.br por um serviço do Google Apps Script da coordenação, que pode gravar uma cópia de segurança numa planilha Google. Sem sinal, o envio espera na fila do celular e sai sozinho quando a conexão volta.

## Privacidade

O aplicativo não acessa OneDrive. Os pedidos e as fotos ficam no celular de quem preencheu e saem só pelo WhatsApp e pelo e-mail da coordenação.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | O aplicativo inteiro (tela, regras, cálculos e a imagem do pedido) |
| `qrcode.js` | Gerador de QR (Kazuhiko Arase, licença MIT), embutido para funcionar sem sinal |
| `sw.js` | Faz o aplicativo abrir sem internet e receber atualizações |
| `manifest.webmanifest` | Nome, cores e ícones para a instalação |
| `icons/` | Ícones do selo U.L18 |

## Publicar uma atualização

1. Altere os arquivos.
2. Aumente a versão em **dois** lugares: `APP_VERSION` no `index.html` e `VERSAO` no `sw.js` (ex.: 1.0.0 → 1.0.1).
3. Envie para o GitHub. Os celulares mostram "Nova versão do aplicativo — Atualizar" na próxima vez que abrirem o app com sinal.

## Hospedagem

GitHub Pages: Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. Endereço: `https://<usuário>.github.io/<repositório>/`.

---
Controle: J.S. Araújo Engenharia
