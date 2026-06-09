const fs = require('fs');

const replacements = [
  // Titles
  [/— AI Math Lab/g, '| AI Math Lab'],
  [/AI Math Lab — Interactive Learning Platform/g, 'AI Math Lab'],
  
  // index.html
  [/Interactive visualizers for Vectors, Matrices, Calculus, Probability and Neural Networks — the mathematical foundations of Artificial Intelligence\./g, 'Interactive math visualizers for AI. Play around with vectors, matrices, calculus, probability, and neural networks.'],
  [/Interactive visualizers for the core math behind modern AI\. Explore, experiment, and build intuition\./g, 'A hands-on way to understand the core math concepts driving machine learning. Play with the interactive demos to see how things actually work.'],
  [/Magnitude, direction, linear combinations, span, and basis — the language of AI feature spaces\./g, 'Understand vectors by seeing them in action. We cover magnitude, direction, linear combinations, span, and basis.'],
  [/Linear transformations, determinants, eigenvalues and eigenvectors — how neural networks rotate and scale space\./g, 'See how matrices transform space. You can visualize linear transformations, determinants, eigenvalues, and eigenvectors.'],
  [/Derivatives, integrals, and gradient descent — the engine that trains every neural network\./g, 'Get a feel for how calculus makes learning possible. We break down derivatives, integrals, and gradient descent.'],
  [/Normal distributions, Bayes' theorem, and the Central Limit Theorem — the mathematical language of uncertainty in AI\./g, 'Grasp how AI handles uncertainty. This module explores normal distributions, Bayes\' theorem, and the Central Limit Theorem.'],
  [/Perceptrons, MLP forward pass, activation functions, and gradient descent — from neuron to deep learning\./g, 'Put it all together by training a neural network in your browser. Watch the forward pass, activation functions, and backpropagation in real time.'],
  
  // vector.html
  [/Interactive 2D\/3D vector visualizer\. Explore magnitude, direction, linear combinations, span, and basis — the language of AI feature spaces\./g, 'Understand vectors by seeing them in action. We cover magnitude, direction, linear combinations, span, and basis in this interactive 2D and 3D visualizer.'],
  [/Combining physics &amp; computer science perspectives — visualize magnitude &amp; direction\./g, 'Visualizing magnitude and direction from both physics and computer science perspectives.'],
  [/— <span data-lang="en">empty<\/span>/g, '<span data-lang="en">(empty)</span>'],

  // matrix.html
  [/Interactive visualizers for Linear transformations, determinants, eigenvalues and eigenvectors — how neural networks rotate and scale space\./g, 'See how matrices transform space. Visualize linear transformations, determinants, eigenvalues, and eigenvectors in your browser.'],
  [/Linear transformations, determinants, and eigenvalues — visual intuition for matrix operations\./g, 'Visual intuition for matrix operations. See how linear transformations, determinants, and eigenvalues actually look.'],

  // calculus.html
  [/Interactive visualizers for Derivatives, integrals, and gradient descent — the engine that trains every neural network\./g, 'Get a feel for how calculus makes learning possible. We break down derivatives, integrals, and gradient descent.'],
  [/Derivatives, integrals, and gradient descent — the math that powers neural network training\./g, 'The math that powers neural network training. We break down derivatives, integrals, and gradient descent step by step.'],

  // probability.html
  [/Interactive visualizers for Normal distributions, Bayes theorem, Binomial distributions and the Central Limit Theorem — the mathematics of uncertainty in AI\./g, 'Grasp how AI handles uncertainty. This module explores normal distributions, Bayes\' theorem, and the Central Limit Theorem.'],
  [/Normal distributions, Bayes' theorem, Binomial and Central Limit Theorem — the math of uncertainty in AI\./g, 'Grasp how AI handles uncertainty. We explore normal distributions, Bayes\' theorem, and the Central Limit Theorem.'],

  // neural.html
  [/Visualize MLP forward pass, activation functions, and gradient descent on a neural network — from neuron to deep learning\./g, 'Watch a neural network learn in your browser. We visualize the forward pass, activation functions, and gradient descent step by step.'],
  [/Forward pass, activation functions, and gradient descent — from single neuron to deep MLP\./g, 'Watch a neural network learn in your browser. We cover the forward pass, activation functions, and gradient descent.'],
  
  // Misc
  [/Built for learning the math behind AI · Source: 3Blue1Brown, Gilbert Strang, Bishop PRML, Nielsen DL/g, 'Created to help you learn the math behind AI. Inspired by 3Blue1Brown, Gilbert Strang, Bishop PRML, and Nielsen DL.'],
  [/— /g, ' '] // Catch remaining standalone dashes to remove them
];

const files = ['index.html', 'vector.html', 'matrix.html', 'calculus.html', 'probability.html', 'neural.html', 'references.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  replacements.forEach(([regex, repl]) => {
    content = content.replace(regex, repl);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
