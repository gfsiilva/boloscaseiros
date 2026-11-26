# Agendamentos (pg_cron)

O Supabase roda a "faxina" de pedidos vencidos automaticamente.
Esse agendamento NAO esta em nenhuma migration: ele foi criado
pelo SQL Editor, porque mexe no schema `cron`.

## Se o projeto for recriado, rode de novo

1. No painel do Supabase, ative a extensao `pg_cron`
   (Database -> Extensions).
2. No SQL Editor, rode:

```sql
select cron.schedule(
  'expire-pending-orders',
  '*/5 * * * *',
  'select public.expire_pending_orders()'
);
```

## O que isso faz

A cada 5 minutos, a funcao `expire_pending_orders()` marca como
`expired` os pedidos `pending` cujo prazo (`hold_expires_at`)
venceu, e libera a reserva de pontos deles.

- 2 horas = prazo do pedido (`business_settings.reservation_hold_hours`)
- 5 minutos = de quanto em quanto tempo o despertador confere

Na pratica, a vaga volta entre 2h e 2h05 depois do envio do pedido.

## Como conferir se esta funcionando

```sql
select status, return_message, start_time
from cron.job_run_details
order by start_time desc
limit 5;
```

Esperado: `status = succeeded`.

```sql
select jobid, jobname, schedule, active from cron.job;
```

Esperado: `expire-pending-orders`, `*/5 * * * *`, `active = true`.
