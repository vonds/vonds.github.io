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

// ../assets/js/docs-search.js (JS)
// Search that matches against each lab's data-filter attribute.
// - Type one or more tags separated by spaces (example: "core boot").
// - Also supports clicking the left sidebar category filters.
// - Search + sidebar selection combine (AND logic).

(function () {
	"use strict";

	function normalize(str) {
		return (str || "").toLowerCase().trim();
	}

	function splitTerms(str) {
		return normalize(str)
			.split(/\s+/)
			.filter(Boolean);
	}

	var searchInput = document.getElementById("labSearch");
	var clearBtn = document.getElementById("clearLabSearch");
	var showAllBtn = document.getElementById("showAllLabs");
	var pill = document.getElementById("activeFilterPill");

	var labItems = Array.prototype.slice.call(
		document.querySelectorAll("#labsGrid li[data-filter]")
	);

	// Tracks the active sidebar filter (single tag or "all")
	var activeSidebarFilter = "all";

	function setPill(text) {
		if (!pill) return;
		pill.textContent = text;
	}

	// True if any filter tag contains the term (partial match)
	function termMatchesAnyTag(term, tags) {
		for (var i = 0; i < tags.length; i++) {
			if (tags[i].indexOf(term) !== -1) return true;
		}
		return false;
	}

	function labMatches(li, searchTerms, sidebarFilter) {
		var tags = splitTerms(li.getAttribute("data-filter"));

		// Sidebar filter: exact tag match (keeps behavior consistent)
		if (sidebarFilter && sidebarFilter !== "all") {
			var sf = normalize(sidebarFilter);
			if (tags.indexOf(sf) === -1) return false;
		}

		// Search terms: partial match inside ANY tag, AND across terms
		// Example: "boo tr" matches tags containing "boo" (boot) AND "tr" (troubleshooting)
		for (var i = 0; i < searchTerms.length; i++) {
			if (!termMatchesAnyTag(searchTerms[i], tags)) return false;
		}

		return true;
	}

	function applyFilters() {
		var terms = searchInput ? splitTerms(searchInput.value) : [];
		var visibleCount = 0;

		for (var i = 0; i < labItems.length; i++) {
			var li = labItems[i];
			var show = labMatches(li, terms, activeSidebarFilter);
			li.style.display = show ? "" : "none";
			if (show) visibleCount++;
		}

		var sidebarText = activeSidebarFilter === "all" ? "all" : activeSidebarFilter;
		var searchText = terms.length ? terms.join(" ") : "none";
		setPill("Active filter: " + sidebarText + " | search: " + searchText + " | results: " + visibleCount);
	}

	// Hook up search input
	if (searchInput) {
		searchInput.addEventListener("input", applyFilters);
	}

	// Clear search
	if (clearBtn) {
		clearBtn.addEventListener("click", function () {
			if (searchInput) searchInput.value = "";
			applyFilters();
		});
	}

	// Show all (reset everything)
	if (showAllBtn) {
		showAllBtn.addEventListener("click", function () {
			activeSidebarFilter = "all";
			if (searchInput) searchInput.value = "";

			// Remove active class from sidebar links (optional)
			var links = document.querySelectorAll(".docs-nav a[data-filter]");
			for (var i = 0; i < links.length; i++) {
				links[i].classList.remove("active");
			}

			applyFilters();
		});
	}

	// Sidebar click behavior
	var sidebarLinks = document.querySelectorAll(".docs-nav a[data-filter]");
	for (var j = 0; j < sidebarLinks.length; j++) {
		sidebarLinks[j].addEventListener("click", function (e) {
			e.preventDefault();

			for (var k = 0; k < sidebarLinks.length; k++) {
				sidebarLinks[k].classList.remove("active");
			}
			this.classList.add("active");

			activeSidebarFilter = this.getAttribute("data-filter") || "all";
			applyFilters();
		});
	}

	// Initial render
	applyFilters();
})();