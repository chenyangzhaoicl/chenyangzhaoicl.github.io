(function () {
  var root = document.getElementById("macaulay2-lab");

  if (!root) {
    return;
  }

  var language = root.dataset.language || "en";

  var labels = {
    en: {
      count: "4 snippets",
      copied: "Copied. The online runner is ready in a new tab.",
      copiedOnly: "Copied.",
      copyFailed: "Could not copy automatically. Select the code manually.",
      reset: "Example reset."
    },
    fr: {
      count: "4 exemples",
      copied: "Copié. Le runner en ligne est prêt dans un nouvel onglet.",
      copiedOnly: "Copié.",
      copyFailed: "La copie automatique a échoué. Sélectionnez le code manuellement.",
      reset: "Exemple réinitialisé."
    }
  };

  var examples = {
    en: [
      {
        title: "Groebner basis warmup",
        tag: "Ideals",
        description: "A first computation with a quotient ring, dimension, degree, and a Groebner basis.",
        code: [
          "R = QQ[a,b,c]",
          "I = ideal(a^2-b*c, b^2-a*c, c^2-a*b)",
          "gens gb I",
          "dim(R/I)",
          "degree(R/I)"
        ].join("\n")
      },
      {
        title: "Young diagram monomial ideal",
        tag: "Hilbert schemes",
        description: "The boundary generators for the partition (4,2,1), viewed as a monomial ideal in QQ[x,y].",
        code: [
          "S = QQ[x,y]",
          "I = monomialIdeal(x^4, x^2*y, x*y^2, y^3)",
          "gens I",
          "basis(0, S/I)",
          "basis(1, S/I)",
          "basis(2, S/I)"
        ].join("\n")
      },
      {
        title: "Betti table of a coordinate arrangement",
        tag: "Resolutions",
        description: "A compact example of free resolutions and Betti tables.",
        code: [
          "T = QQ[p,q,r]",
          "I = ideal(p*q, p*r, q*r)",
          "C = res I",
          "betti C"
        ].join("\n")
      },
      {
        title: "Elimination from a parametrized curve",
        tag: "Implicitization",
        description: "Eliminate a parameter from the cusp parametrization u=t^2, v=t^3.",
        code: [
          "U = QQ[t,u,v, MonomialOrder => Eliminate 1]",
          "I = ideal(u-t^2, v-t^3)",
          "gens gb I"
        ].join("\n")
      }
    ],
    fr: [
      {
        title: "Échauffement avec une base de Gröbner",
        tag: "Idéaux",
        description: "Un premier calcul avec un anneau quotient, sa dimension, son degré et une base de Gröbner.",
        code: [
          "R = QQ[a,b,c]",
          "I = ideal(a^2-b*c, b^2-a*c, c^2-a*b)",
          "gens gb I",
          "dim(R/I)",
          "degree(R/I)"
        ].join("\n")
      },
      {
        title: "Idéal monomial d'un diagramme de Young",
        tag: "Schémas de Hilbert",
        description: "Les générateurs du bord pour la partition (4,2,1), vus comme un idéal monomial dans QQ[x,y].",
        code: [
          "S = QQ[x,y]",
          "I = monomialIdeal(x^4, x^2*y, x*y^2, y^3)",
          "gens I",
          "basis(0, S/I)",
          "basis(1, S/I)",
          "basis(2, S/I)"
        ].join("\n")
      },
      {
        title: "Table de Betti d'un arrangement de coordonnées",
        tag: "Résolutions",
        description: "Un exemple court de résolution libre et de table de Betti.",
        code: [
          "T = QQ[p,q,r]",
          "I = ideal(p*q, p*r, q*r)",
          "C = res I",
          "betti C"
        ].join("\n")
      },
      {
        title: "Élimination d'une courbe paramétrée",
        tag: "Implicitisation",
        description: "Éliminer un paramètre de la paramétrisation cuspidale u=t^2, v=t^3.",
        code: [
          "U = QQ[t,u,v, MonomialOrder => Eliminate 1]",
          "I = ideal(u-t^2, v-t^3)",
          "gens gb I"
        ].join("\n")
      }
    ]
  };

  var activeIndex = 0;
  var copyTimer = null;
  var dictionary = labels[language] || labels.en;
  var exampleList = document.getElementById("m2-example-list");
  var exampleCount = document.getElementById("m2-example-count");
  var title = document.getElementById("m2-active-title");
  var kicker = document.getElementById("m2-active-kicker");
  var description = document.getElementById("m2-active-description");
  var code = document.getElementById("m2-code");
  var status = document.getElementById("m2-status");
  var copy = document.getElementById("m2-copy");
  var copyOpen = document.getElementById("m2-copy-open");
  var reset = document.getElementById("m2-reset");
  var runnerSelect = document.getElementById("m2-runner-select");
  var runnerFrame = document.getElementById("m2-runner-frame");
  var runnerDirect = document.getElementById("m2-runner-direct");
  var currentExamples = examples[language] || examples.en;

  function setStatus(message) {
    window.clearTimeout(copyTimer);
    status.textContent = message;
    copyTimer = window.setTimeout(function () {
      status.textContent = "";
    }, 2800);
  }

  function renderExamples() {
    exampleCount.textContent = dictionary.count;
    exampleList.innerHTML = "";

    currentExamples.forEach(function (example, index) {
      var button = document.createElement("button");
      button.className = "m2-example-button";
      button.type = "button";
      button.innerHTML = "<strong></strong><span></span>";
      button.querySelector("strong").textContent = example.title;
      button.querySelector("span").textContent = example.tag;
      button.addEventListener("click", function () {
        setExample(index);
      });
      exampleList.appendChild(button);
    });
  }

  function setExample(index) {
    var example = currentExamples[index];
    activeIndex = index;
    title.textContent = example.title;
    kicker.textContent = example.tag;
    description.textContent = example.description;
    code.value = example.code;

    Array.from(exampleList.children).forEach(function (button, buttonIndex) {
      button.classList.toggle("is-active", buttonIndex === index);
    });
  }

  async function copyCode() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code.value);
      } else {
        code.focus();
        code.select();
        document.execCommand("copy");
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function updateRunnerHost() {
    var url = runnerSelect.value;
    runnerFrame.src = url;
    runnerDirect.href = url;
  }

  copy.addEventListener("click", async function () {
    var ok = await copyCode();
    setStatus(ok ? dictionary.copiedOnly : dictionary.copyFailed);
  });

  copyOpen.addEventListener("click", async function () {
    var ok = await copyCode();
    window.open(runnerSelect.value, "_blank", "noopener");
    setStatus(ok ? dictionary.copied : dictionary.copyFailed);
  });

  reset.addEventListener("click", function () {
    setExample(activeIndex);
    setStatus(dictionary.reset);
  });

  runnerSelect.addEventListener("change", updateRunnerHost);

  renderExamples();
  setExample(0);
})();
