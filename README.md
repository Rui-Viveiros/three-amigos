# Three Amigos
Turn-based card game where players take turns playing cards from their hand and table until a player has no more cards to play. The game is designed for 2-4 players and combines strategy with luck.

## 🎮 Estrutura fundamental do jogo
### Objetivo
Ser o primeiro jogador a ficar sem cartas — nem na mão, nem na mesa (topo e fundo).
### Componentes principais
- Jogadores (2–4), cada um com:
    - Mão: 3 cartas
    - Mesa: 6 cartas em grelha 1×3 (3 visíveis + 3 escondidas)
- Baralho principal  
    - Usado para repor a mão após cada jogada.

- Pilha central  
    - Onde as cartas são jogadas em ordem crescente.

## 🔁 Fluxo de jogo por turno
### 1. O jogador escolhe uma carta para jogar:

    - Primeiro da mão.

    - Quando a mão estiver vazia, joga das 3 cartas visíveis da mesa.

    - Quando essas acabarem, joga das 3 cartas escondidas (viradas ao acaso).

### 2. Regra de ordem crescente  
A carta jogada deve ser igual ou maior que a carta do topo da pilha, exceto:

    - Cartas especiais (1, 2, 7, 8, 10) que têm regras próprias.

### 3. Jogada múltipla  
Se o jogador tiver várias cartas do mesmo valor, pode jogá‑las juntas.

### 4. Limpeza da pilha  
A pilha é removida do jogo quando:

    - O jogador joga 4 cartas iguais no mesmo turno, ou
    - A pilha atinge 4 cartas iguais consecutivas, ou
    - O jogador joga um 10.

Depois disso, o jogador joga novamente

### 5. Se não puder jogar  
O jogador apanha toda a pilha e termina o turno.

### 6. Reposição da mão  
No fim do turno, se houver cartas no baralho, o jogador volta a ter 3 cartas na mão.

## ✨ Cartas especiais e efeitos
### 1 - Wild ofensivo
- Pode ser jogado sobre qualquer carta exceto 7.
- Obriga um jogador escolhido a jogar imediatamente (salta a ordem normal).

### 2 - Reset
- Pode ser jogado sobre qualquer carta.
- Define o valor da pilha como 0, permitindo qualquer carta a seguir.

### 7 - Restrição
- O próximo jogador só pode jogar cartas de valor 6 ou inferior.

### 8 - Skip
- O próximo jogador perde o turno.

### 10 - Clear
- Limpa a pilha imediatamente.
- O jogador joga outra carta.

## 🧠 Mecânicas estratégicas importantes
A gestão da mão é crítica: jogar demasiado cedo cartas altas pode bloquear-te mais tarde.

As cartas visíveis da mesa criam informação pública que influencia decisões dos outros jogadores.

As cartas escondidas introduzem risco e aleatoriedade no final do jogo.

As cartas especiais criam momentos táticos fortes (skip, reset, clear, forced play).