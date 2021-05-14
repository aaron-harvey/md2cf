
!!! include extra/style.css.md !!!

!!! note This is the admonition title
This is the admonition body
!!!


``` js {title=dope linenumbers=true firstline=50 theme=emacs collapse=true}
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
```

```nomnoml
[Pirate|eyeCount: Int|raid();pillage()|
  [beard]--[parrot]
  [beard]-:>[foul mouth]
]

[<table>mischief | bawl | sing || yell | drink]

[<abstract>Marauder]<:--[Pirate]
[Pirate]- 0..7[mischief]
[jollyness]->[Pirate]
[jollyness]->[rum]
[jollyness]->[singing]
[Pirate]-> *[rum|tastiness: Int|swig()]
[Pirate]->[singing]
[singing]<->[rum]

```
