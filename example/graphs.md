---
title: demo
tags:
  - tag1
  - tag2
---

## Graphs
#### mermaid
``` mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

#### dot
```dot
digraph example1 {
    1 -> 2 -> { 4, 5 };
    1 -> 3 -> { 6, 7 };
}
```

#### ditaa
```ditaa
+--------+   +-------+    +-------+
|        +---+ ditaa +--> |       |
|  Text  |   +-------+    |diagram|
|Document|   |!magic!|    |       |
|     {d}|   |       |    |       |
+---+----+   +-------+    +-------+
  :                         ^
  |       Lots of work      |
  +-------------------------+
```

### plantuml

```plantuml

[*] --> State1
State1 --> [*]
State1 : this is a string
State1 : this is another string

State1 -> State2
State2 --> [*]

```


