# Regras de negocio - Bolos Caseiros

Este documento explica COMO a loja funciona e POR QUE. Se uma regra
mudar, atualize aqui e na configuracao do painel.

## 1. Como um pedido acontece

1. O cliente escolhe os bolos no site, o sabor, o dia e o horario.
2. Ele informa nome e telefone (o mesmo numero do WhatsApp).
3. O site envia o pedido e abre o WhatsApp com a mensagem pronta.
4. A dona manda o PIX da entrada (50%) pelo WhatsApp.
5. Quando recebe, ela confirma no painel. So entao a vaga fica fixa.

O site NAO cobra nada e o cliente NAO faz login. O dinheiro e
combinado pelo WhatsApp.

## 2. A vaga "a lapis"

- Ao enviar o pedido, a vaga fica segurada por 2 horas.
- Se a dona confirmar a entrada nesse prazo, a vaga fica fixa.
- Se nao confirmar (ou ela recusar), a vaga volta para a agenda.
- Quem libera sozinho e a "faxina", que roda de 5 em 5 minutos
  (veja cron.md). Por isso a vaga volta entre 2h e 2h05.

Por que 2 horas: evita que um pedido esquecido prenda a agenda.
O valor fica em business_settings e a dona pode mudar.

## 3. Capacidade (pontos)

- Cada bolo gasta pontos de producao. Padrao: 8 pontos por dia.
- A dona pode mudar a capacidade de um dia especifico.
- Pronta entrega NAO gasta pontos; tem estoque por dia.

## 4. Prazo de antecedencia

- Cada bolo tem um prazo minimo (em horas) e, se quiser, um horario
  limite no dia.
- Em um carrinho com varios bolos, vale o MAIOR prazo.
- Pronta entrega nao entra nessa conta.

## 5. Produtos, tamanhos e sabores

- Cada tamanho e um produto separado (ex.: "Bolo de 20 cm").
- Cada bolo tem sabores, e cada sabor tem o PROPRIO preco final.
- O sabor nao muda pontos nem prazo.
- Produtos e sabores nao sao apagados, so desativados, porque
  pedidos antigos dependem deles.

## 6. Limites contra abuso

- No maximo 2 pedidos pendentes por telefone.
- Um telefone = um cliente.

## 7. O que a dona pode fazer no painel

| Acao               | O que acontece                                           |
| ------------------ | -------------------------------------------------------- |
| Confirmar entrada  | Pedido vira "confirmado"; vaga fixa                      |
| Cancelar / recusar | Vaga volta; o pagamento fica no historico                |
| Reativar           | Volta o pedido se ainda ha vaga (ou ela decide encaixar) |
| Concluir           | Cliente retirou; saldo pode ser registrado               |
| Ajustar valor      | Soma ou desconta, com motivo obrigatorio                 |

O sistema nunca devolve dinheiro. Se precisar devolver o sinal,
a dona resolve pelo WhatsApp.

## 8. Seguranca (resumo)

- O visitante so le o cardapio e cria pedidos.
- Pedidos, clientes e pagamentos so sao mudados pelas funcoes do
  painel, nunca direto, para a vaga nunca ficar presa.
- Dados de clientes (nome e telefone) so o admin ve.

## 9. Perguntas ainda em aberto com a dona

- Capacidade e fixa ou muda por dia da semana?
- Horarios de retirada fixos ou intervalo livre?
- O estoque de pronta entrega e fixo ou diario?
- Valores reais de pontos e prazos de cada bolo.
- O cliente perde o sinal ao cancelar? Em quais condicoes?
- Bolo personalizado tem preco fixo ou precisa de orcamento?
- Cada bolo tem massa e recheio separados, ou um sabor so?
