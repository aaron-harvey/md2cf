---
desc: Admonition
skip: false
---

should render alerts
.
!!! include ../tests/fixtures/admonition/style.css.md !!!

!!! note This is the admonition title
    This is the admonition body
.
<ac:structured-macro ac:macro-id="tox75" ac:name="html" ac:schema-version="1">
  <ac:plain-text-body>
    <![CDATA[<style>
.admonition {}
.admonition>.admonition-title {}
</style>
]]>
  </ac:plain-text-body>
</ac:structured-macro>
<div class="admonition note">
<p class="admonition-title">This is the admonition title</p>
<p>This is the admonition body</p>
</div>
.
