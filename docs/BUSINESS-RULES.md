# Regras de Negócio e Apuração — PontoVision AI

## 1. Modelo de Jornada de Trabalho
1. **Configuração Semanal:**
   - Cada usuário possui uma jornada semanal configurada (`WorkSchedule`), contendo regras por dia da semana (domingo a sábado).
   - Exemplos: Segunda a Sexta: 8 horas diárias (480 min), Sábado e Domingo: folga (0h).
2. **Tolerância Legal (Art. 58 § 1º CLT):**
   - Variações de horário de até 5 minutos por marcação, observado o limite máximo de 10 minutos diários, não são computadas como sobrejornada nem descontadas.

## 2. Tipos de Marcações
- `ENTRY` (Entrada): Início do primeiro turno de trabalho.
- `INTERVAL_START` (Saída para intervalo): Início do intervalo intrajornada.
- `INTERVAL_END` (Retorno do intervalo): Retorno do intervalo.
- `EXIT` (Saída final): Término da jornada diária.
- `OTHER` (Outra marcação): Batidas adicionais ou extraordinárias.

## 3. Apuração Diária
- O total trabalhado em um dia regular de 4 batidas é dado por:
  `Total Trabalhado = (IntervalStart - Entry) + (Exit - IntervalEnd)`
- Em casos de batidas ímpares, o sistema sinaliza como **Incompleto** e emite alertas visuais.
- O saldo diário é apurado por: `Saldo = Total Trabalhado - Horas Previstas`.

## 4. Feriados e Exceções
- Dias marcados como feriado nacional, estadual ou personalizado têm jornada prevista ajustada conforme a regra corporativa do usuário.
