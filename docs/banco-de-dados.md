# Banco de dados - Bolos Caseiros

Escrito a partir da estrutura real do banco em 2026-11-25.
Colunas completas: veja as migrations em supabase/migrations.

## Diagrama

```mermaid
erDiagram
    categories ||--o{ products : "agrupa"
    products ||--o{ product_flavors : "tem sabores"
    products ||--o{ order_items : "vendido em"
    products ||--o{ ready_stock : "estoque"
    production_days ||--o{ pickup_slots : "tem horarios"
    production_days ||--o{ production_reservations : "recebe"
    production_days ||--o{ ready_stock : "estoque do dia"
    customers ||--o{ orders : "faz"
    pickup_slots ||--o{ orders : "retirada em"
    orders ||--o{ order_items : "contem"
    orders ||--o{ payments : "recebe"
    orders ||--o{ production_reservations : "ocupa"
    orders ||--o{ order_adjustments : "ajustes"
    AUTH_USERS ||--o| admins : "e admin"
    AUTH_USERS ||--o{ payments : "confirmou"
    AUTH_USERS ||--o{ order_adjustments : "ajustou"

    categories {
        uuid id PK
        text name
        bool active
    }
    products {
        uuid id PK
        uuid category_id FK
        text name
        int price_cents
        production_type production_type
        int production_points
        int preparation_lead_time_hours
        time daily_cutoff_time
        int max_per_order
        bool is_ready_made
        text image_path
        bool active
        timestamptz deleted_at
    }
    product_flavors {
        uuid id PK
        uuid product_id FK
        text name
        int price_cents
        int sort_order
        text image_path
        bool active
    }
    production_days {
        uuid id PK
        date production_date
        int capacity_points
        bool is_open
    }
    pickup_slots {
        uuid id PK
        uuid production_day_id FK
        time slot_time
        bool active
    }
    ready_stock {
        uuid id PK
        uuid production_day_id FK
        uuid product_id FK
        int quantity
    }
    customers {
        uuid id PK
        text name
        text phone
    }
    orders {
        uuid id PK
        uuid customer_id FK
        uuid pickup_slot_id FK
        order_status status
        int total_cents
        text notes
        timestamptz hold_expires_at
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        text product_name
        text flavor_name
        int unit_price_cents
        int quantity
        int points_per_unit
    }
    payments {
        uuid id PK
        uuid order_id FK
        uuid confirmed_by FK
        int amount_cents
        payment_status status
        timestamptz confirmed_at
    }
    production_reservations {
        uuid id PK
        uuid order_id FK
        uuid production_day_id FK
        int points
        reservation_status status
    }
    order_adjustments {
        uuid id PK
        uuid order_id FK
        uuid created_by FK
        int amount_cents
        text reason
    }
    admins {
        uuid user_id PK
        text role
    }
    business_settings {
        bool id PK
        int default_daily_capacity_points
        int reservation_hold_hours
        int max_pending_orders_per_phone
        int booking_window_days
    }
```

## Por que cada tabela existe

| Tabela                  | Para que serve                                               |
| ----------------------- | ------------------------------------------------------------ |
| categories              | Agrupa os bolos no cardapio                                  |
| products                | Cada bolo (cada tamanho e um produto). Guarda pontos e prazo |
| product_flavors         | Sabores de um bolo, cada um com o proprio preco final        |
| production_days         | Os dias de producao e a capacidade de cada um                |
| pickup_slots            | Os horarios de retirada de cada dia                          |
| ready_stock             | Estoque de pronta entrega por dia (nao gasta pontos)         |
| customers               | Nome e telefone de quem pede (um telefone = um cliente)      |
| orders                  | O pedido: quem, quando retira, total e situacao              |
| order_items             | Os itens do pedido, com "foto" do nome, sabor e preco        |
| payments                | O dinheiro que a dona confirmou (historico)                  |
| production_reservations | Os pontos que cada pedido ocupa em um dia                    |
| order_adjustments       | Ajustes de valor, sempre com motivo                          |
| admins                  | Quem pode usar o painel                                      |
| business_settings       | Regras da loja (linha unica)                                 |

## Decisoes de modelagem (os porques)

- order_items guarda o nome, o sabor e o preco NO MOMENTO da compra.
  Assim o pedido antigo continua certo mesmo se a dona mudar o produto.
- orders nao tem coluna de dia. O dia vem de pickup_slots, ligado a
  production_days. Dia e horario nunca podem se contradizer.
- Produtos, sabores e dias nao sao apagados, so desativados.
- Valores em centavos (inteiros), sem erro de arredondamento.
- Pedidos, clientes e pagamentos nao tem permissao de escrita direta:
  so mudam por funcoes, para a vaga nunca ficar presa.
- customers.email existe mas nao e usada (o cliente informa so nome
  e telefone).

## Funcoes

| Funcao                                              | O que faz                                                | Quem chama            |
| --------------------------------------------------- | -------------------------------------------------------- | --------------------- |
| create_order                                        | Cria o pedido (confere tudo; trava o dia)                | Visitante             |
| available_pickup_options                            | Dias e horarios validos para um carrinho (so uma previa) | Visitante             |
| day_capacity, day_used_points, day_available_points | Contas de pontos do dia                                  | Visitante             |
| earliest_pickup                                     | Primeiro instante de retirada possivel                   | Visitante             |
| ready_available                                     | Estoque de pronta entrega que ainda resta                | Visitante             |
| expire_pending_orders                               | Faxina: expira pedidos vencidos e libera a vaga          | Despertador (pg_cron) |
| is_admin                                            | Responde se quem chama e admin                           | Logado                |
| admin_confirm_order                                 | Confirma a entrada (50% ou outro valor)                  | Admin                 |
| admin_cancel_order                                  | Cancela/recusa e libera a vaga                           | Admin                 |
| admin_reactivate_order                              | Reativa pedido expirado/cancelado se houver vaga         | Admin                 |
| admin_complete_order                                | Conclui na retirada (registra o saldo)                   | Admin                 |
| admin_add_order_adjustment                          | Ajusta o valor com motivo                                | Admin                 |
| admin_list_orders                                   | Lista pronta para o painel                               | Admin                 |

## Storage (fotos)

Bucket publico product-images (5 MB, so jpeg/png/webp). Qualquer pessoa
ve; so admin envia, troca e apaga. O banco guarda so o CAMINHO da foto.
