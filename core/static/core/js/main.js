document.addEventListener("DOMContentLoaded", function () {
    const animatedItems = document.querySelectorAll(".footer-animate");

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        { threshold: 0.2 }
    );

    animatedItems.forEach(item => observer.observe(item));
});


document.addEventListener("scroll", () => {
  document.querySelectorAll(".vision-card, .faith-card").forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      card.classList.add("show");
    }
  });
});
