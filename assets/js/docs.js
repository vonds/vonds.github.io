document.addEventListener("DOMContentLoaded", function () {
  const filterLinks = document.querySelectorAll(".docs-nav a[data-filter]");
  const labItems = document.querySelectorAll(".labs-grid li");

  if (!filterLinks.length || !labItems.length) {
    return;
  }

  function clearActiveStates() {
    filterLinks.forEach(link => link.classList.remove("active"));
  }

  function getTagsFromAttribute(value) {
    // Handles: null, extra spaces, or accidental commas
    if (!value) return [];
    return value
      .replace(/,/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function filterLabs(filter) {
    labItems.forEach(item => {
      const itemFilterRaw = item.getAttribute("data-filter");
      const tags = getTagsFromAttribute(itemFilterRaw);

      // If the lab has no tags, hide it (safe default)
      if (!tags.length) {
        item.style.display = "none";
        return;
      }

      if (filter === "all" || tags.includes(filter)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  }

  filterLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const filter = this.getAttribute("data-filter");

      clearActiveStates();
      this.classList.add("active");

      filterLabs(filter);
    });
  });
});
