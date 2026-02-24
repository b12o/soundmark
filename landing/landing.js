const heroImg = document.getElementById("hero-img");

// Add a sleek hover interaction to the hero image
if (heroImg) {
  heroImg.addEventListener("mouseenter", () => {
    heroImg.style.transform = "scale(1.03) translateY(-5px)";
    heroImg.style.boxShadow = "0 20px 50px rgba(0,0,0,0.8)";
  });

  heroImg.addEventListener("mouseleave", () => {
    heroImg.style.transform = "";
    heroImg.style.boxShadow = "";
  });
}

