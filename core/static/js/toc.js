document.addEventListener("DOMContentLoaded", function () {
  const content = document.getElementById("post-content");
  const toc = document.getElementById("toc");

  if (!content || !toc) return;

  const headings = content.querySelectorAll("h2, h3");
  if (!headings.length) {
    toc.style.display = "none";
    return;
  }

  let html = "<strong>Contents</strong><ul>";
  headings.forEach((heading, index) => {
    const id = "section-" + index;
    heading.id = id;
    html += `<li class="toc-${heading.tagName.toLowerCase()}">
      <a href="#${id}">${heading.innerText}</a>
    </li>`;
  });
  html += "</ul>";
  toc.innerHTML = html;
});
