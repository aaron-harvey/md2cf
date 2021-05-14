---
desc: Task List
skip: false
---
renders single nested task
.
- [ ] Item
  - [x] Item 2
.
<ac:task-list>
  <ac:task>
    <ac:task-id>1</ac:task-id>
    <ac:task-status>incomplete</ac:task-status>
    <ac:task-body>Item</ac:task-body>
    <ac:task-list>
      <ac:task>
        <ac:task-id>2</ac:task-id>
        <ac:task-status>complete</ac:task-status>
        <ac:task-body>Item 2</ac:task-body>
      </ac:task>
    </ac:task-list>
  </ac:task>
</ac:task-list>
.
