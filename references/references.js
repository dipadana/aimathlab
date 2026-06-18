const dict = {
  en: {
    hub: "← Hub",
    maintitle: "Scientific Methodology & References",
    maindesc: "A rigorous breakdown of the mathematical theories powering Artificial Intelligence, answering the <em>Why</em>, <em>How</em>, <em>Where</em>, and <em>From Whom</em>.",
    
    why: "WHY", how: "HOW", where: "WHERE", who: "FROM WHOM",
    why_sub: "The Theoretical Necessity",
    how_sub: "Mathematical Mechanics",
    where_sub: "Modern Applications",
    who_sub: "Foundational Literature",

    vec_title: "1. Vector Spaces & Embeddings",
    vec_why: "In machine learning, data is rarely scalar. Images, text, and audio are high-dimensional entities. Vector spaces provide a formal algebraic framework to measure distance, similarity, and magnitude between these entities. Without vector spaces, there is no mathematical definition of \"semantic similarity.\"",
    vec_how: "A vector $\\mathbf{v} \\in \\mathbb{R}^n$ represents a point or direction in $n$-dimensional space. The most critical operation in AI is the inner (dot) product: $\\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i=1}^n a_i b_i = \\|\\mathbf{a}\\| \\|\\mathbf{b}\\| \\cos(\\theta)$. This operation computes the projection of one vector onto another, directly measuring angular alignment (cosine similarity).",
    vec_where: "Vector spaces are the foundation of <strong>Word Embeddings (Word2Vec)</strong> and <strong>Transformer Attention Mechanisms</strong>. In Large Language Models (LLMs), a word or token is mapped to a vector $\\mathbf{x} \\in \\mathbb{R}^d$. The \"attention\" score between query $\\mathbf{q}$ and key $\\mathbf{k}$ is simply their scaled dot product: $\\text{Attention} \\propto \\exp(\\frac{\\mathbf{q} \\cdot \\mathbf{k}}{\\sqrt{d}})$.",
    
    mat_title: "2. Matrix Transformations & SVD",
    mat_why: "A neural network is fundamentally a composition of linear transformations interleaved with non-linearities. Matrices represent these linear mappings compactly. To learn hierarchical representations, an AI must stretch, rotate, and project data spaces, which is strictly defined by matrix multiplication.",
    mat_how: "A linear transformation is applied via $T(\\mathbf{x}) = \\mathbf{A}\\mathbf{x}$. The behavior of $\\mathbf{A}$ can be completely understood through its <strong>Singular Value Decomposition (SVD)</strong>: $\\mathbf{A} = \\mathbf{U}\\mathbf{\\Sigma}\\mathbf{V}^T$. This theorem proves that <em>any</em> matrix transformation is simply a rotation ($\\mathbf{V}^T$), a scaling along orthogonal axes ($\\mathbf{\\Sigma}$), followed by another rotation ($\\mathbf{U}$).",
    mat_where: "<strong>Weight Matrices:</strong> The parameters of a dense neural network layer are stored in a weight matrix $\\mathbf{W}$.<br><strong>LoRA (Low-Rank Adaptation):</strong> Modern fine-tuning of LLMs relies on the principle that the change in weights $\\Delta \\mathbf{W}$ has a low intrinsic rank, allowing it to be decomposed into two smaller matrices $\\mathbf{A}$ and $\\mathbf{B}$, heavily relying on SVD theory.",

    cal_title: "3. Multivariable Calculus & Optimization",
    cal_why: "AI models do not simply \"know\" the correct weights; they must <em>search</em> for them. Optimization provides the compass. By framing learning as the minimization of a loss function $L(\\mathbf{\\theta})$, calculus provides the gradient vector $\\nabla L$, which points in the direction of steepest ascent.",
    cal_how: "<strong>Gradient Descent:</strong> The parameter update rule is $\\mathbf{\\theta}_{t+1} = \\mathbf{\\theta}_t - \\alpha \\nabla L(\\mathbf{\\theta}_t)$, where $\\alpha$ is the learning rate. <br><strong>Taylor Series:</strong> The Taylor polynomial $f(x) \\approx f(a) + f'(a)(x-a) + \\frac{f''(a)}{2!}(x-a)^2$ is used to approximate loss landscapes. First-order optimization uses the linear term (Gradient Descent), while second-order methods use the quadratic term (Newton's Method).",
    cal_where: "Every modern neural network is trained using variants of stochastic gradient descent. The <strong>Adam Optimizer</strong> computes adaptive learning rates based on estimates of the first moment (the gradient) and the second moment (the uncentered variance of the gradient).",

    prob_title: "4. Probability, Statistics & Bayes",
    prob_why: "The real world is noisy, ambiguous, and incomplete. Neural networks do not output deterministic truths; they output probabilities. Furthermore, the initialization of networks and the modeling of natural phenomena assume underlying statistical distributions to maintain mathematical stability.",
    prob_how: "<strong>Central Limit Theorem (CLT):</strong> The sum of $n$ independent identically distributed variables converges to a Normal distribution $\\mathcal{N}(\\mu, \\sigma^2)$ as $n \\to \\infty$.<br><strong>Bayes' Theorem:</strong> $P(\\theta | X) = \\frac{P(X | \\theta) P(\\theta)}{P(X)}$. It formalizes how to update our beliefs (the <em>prior</em> $P(\\theta)$) after observing evidence (the <em>likelihood</em> $P(X | \\theta)$).",
    prob_where: "<strong>Weight Initialization:</strong> Weights are initialized using scaled normal distributions (e.g., Xavier/He initialization) to prevent activations from exploding or vanishing.<br><strong>Diffusion Models (e.g., Midjourney, DALL-E):</strong> Image generation is modeled as a <em>Markov Chain</em> that iteratively removes Gaussian noise from a sample, mathematically reversing a forward diffusion process.",

    neu_title: "5. Deep Learning & Backpropagation",
    neu_why: "To solve complex, non-linearly separable problems (like the XOR problem), an AI needs multiple layers of representation. Deep neural networks automatically learn these hierarchical representations.",
    neu_how: "<strong>The Forward Pass:</strong> $\\mathbf{a}^{(l)} = \\sigma(\\mathbf{W}^{(l)} \\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)})$. A linear mapping followed by a non-linear activation $\\sigma$ (e.g., ReLU).<br><strong>Backpropagation:</strong> The gradient of the loss with respect to any weight is calculated efficiently by applying the calculus chain rule backward from the output layer to the input. For example: $\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial a} \\frac{\\partial a}{\\partial z} \\frac{\\partial z}{\\partial w}$.",
    neu_where: "The Multilayer Perceptron (MLP) and Backpropagation form the computational engine of absolutely every modern deep learning system, from simple classifiers to trillion-parameter autoregressive language models (GPT-4) and Convolutional Neural Networks (ResNet).",

    dh_title: "6. Dahono Labs Gateway",
    dh_where: "The AI Tutor feature in this project is powered by <strong>Dahono Labs API Gateway</strong>. It is designed to be 100% compatible with the OpenAI API format, allowing seamless integration with existing tools and models.",
    dh_how: "The gateway acts as an intelligent router and load balancer. AIMathLab sends the mathematical state (vector coordinates, matrix values, etc.) to the <code>dahono/ccai-pro</code> model via a Vercel serverless edge function, ensuring the API key remains completely secure. The responses are then streamed back to the browser in real-time using Server-Sent Events (SSE)."
  },
  ja: {
    hub: "← ホーム",
    maintitle: "科学的背景と参考文献",
    maindesc: "人工知能を支える数学理論について、「なぜ（Why）」「どのように（How）」「どこで（Where）」「誰が（From Whom）」という観点から体系的に解説します。",
    
    why: "WHY", how: "HOW", where: "WHERE", who: "FROM WHOM",
    why_sub: "理論的背景（なぜ必要なのか）",
    how_sub: "数学的メカニズム（どのような仕組みか）",
    where_sub: "現代AIでの応用（どこで使われるか）",
    who_sub: "基礎となる参考文献（誰が提唱したか）",

    vec_title: "1. ベクトル空間と埋め込み",
    vec_why: "機械学習において、扱うデータが単一の数値（スカラー）であることはほぼありません。画像やテキスト、音声はすべて高次元のデータです。ベクトル空間は、これらのデータ間の距離や類似度、大きさを計算するための代数的な基盤となります。ベクトル空間なしでは、「意味が似ていること」を数学的に定義できません。",
    vec_how: "ベクトル $\\mathbf{v} \\in \\mathbb{R}^n$ は、$n$次元空間における点や方向を表します。AIで最も重要な計算は「内積（ドット積）」です。$\\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i=1}^n a_i b_i = \\|\\mathbf{a}\\| \\|\\mathbf{b}\\| \\cos(\\theta)$ と定義され、一方のベクトルをもう一方へ射影することで、2つのベクトルの向きの近さ（コサイン類似度）を直接計算します。",
    vec_where: "ベクトル空間は、<strong>単語の埋め込み（Word2Vec）</strong>や<strong>Transformerのアテンション（Attention）機構</strong>の基礎となっています。大規模言語モデル（LLM）では、単語（トークン）はベクトル $\\mathbf{x} \\in \\mathbb{R}^d$ に変換されます。クエリ $\\mathbf{q}$ とキー $\\mathbf{k}$ の関連度を示す「Attentionスコア」は、基本的には内積をスケーリングしたものです（$\\text{Attention} \\propto \\exp(\\frac{\\mathbf{q} \\cdot \\mathbf{k}}{\\sqrt{d}})$）。",
    
    mat_title: "2. 行列変換と特異値分解（SVD）",
    mat_why: "ニューラルネットワークは、本質的に「線形変換」と「非線形変換」の繰り返しで構成されています。行列はこの線形変換を非常に効率的に表現します。複雑な特徴を学習するためには、入力空間を回転させたり引き伸ばしたりする必要がありますが、これはすべて行列の掛け算として厳密に定義されます。",
    mat_how: "データに対する線形変換は $T(\\mathbf{x}) = \\mathbf{A}\\mathbf{x}$ の形で適用されます。行列 $\\mathbf{A}$ の性質は、<strong>特異値分解（SVD）</strong> によって完全に紐解くことができます（$\\mathbf{A} = \\mathbf{U}\\mathbf{\\Sigma}\\mathbf{V}^T$）。この定理により、「どのような行列変換も、回転（$\\mathbf{V}^T$）、軸に沿った拡大縮小（$\\mathbf{\\Sigma}$）、そしてもう一度回転（$\\mathbf{U}$）の組み合わせにすぎない」ことが証明されています。",
    mat_where: "<strong>重み行列（Weight Matrices）：</strong> ニューラルネットワークの各層のパラメータは、重み行列 $\\mathbf{W}$ として保持されます。<br><strong>LoRA (Low-Rank Adaptation)：</strong> 現代のLLMのファインチューニング手法であるLoRAは、「学習による重みの変化 $\\Delta \\mathbf{W}$ は、本質的にランク（次元）が低い」という仮定に基づいています。SVDの理論を応用し、巨大な行列を2つの小さな行列 $\\mathbf{A}$ と $\\mathbf{B}$ の積に分解することで計算量を激減させています。",

    cal_title: "3. 多変数微積分と最適化",
    cal_why: "AIモデルは最初から最適な重み（パラメータ）を知っているわけではなく、学習を通じてそれを「探索」する必要があります。微積分はその探索のための羅針盤となります。学習の目的を「損失関数 $L(\\mathbf{\\theta})$ の最小化」と定義することで、微積分は最も急な傾きを示す勾配ベクトル $\\nabla L$ を導き出してくれます。",
    cal_how: "<strong>勾配降下法：</strong> パラメータの更新式は $\\mathbf{\\theta}_{t+1} = \\mathbf{\\theta}_t - \\alpha \\nabla L(\\mathbf{\\theta}_t)$ となり、$\\alpha$ は学習率（Learning Rate）を表します。<br><strong>テイラー展開：</strong> 多項式近似である $f(x) \\approx f(a) + f'(a)(x-a) + \\frac{f''(a)}{2!}(x-a)^2$ は、複雑な損失関数の形状（Loss Landscape）を近似するために使われます。一次項のみを使うのが勾配降下法であり、二次項まで考慮するのがニュートン法などの二次最適化手法です。",
    cal_where: "現代のディープラーニングモデルはすべて、確率的勾配降下法（SGD）の派生アルゴリズムで学習されています。特に有名な <strong>Adamオプティマイザ</strong> は、勾配の1次モーメント（平均）と2次モーメント（分散）を推定することで、パラメータごとに学習率を自動調整する強力な手法です。",

    prob_title: "4. 確率論、統計学、ベイズの定理",
    prob_why: "現実世界のデータはノイズを含み、曖昧で不完全です。そのためAIは、絶対的な「正解」ではなく「確率」を出力します。また、ネットワークの初期化やデータのモデリングにおいても、学習の安定性を保つために統計的分布の概念が不可欠です。",
    prob_how: "<strong>中心極限定理（CLT）：</strong> 互いに独立な多数の確率変数の和は、$n \\to \\infty$ のとき正規分布 $\\mathcal{N}(\\mu, \\sigma^2)$ に収束するという強力な定理です。<br><strong>ベイズの定理：</strong> $P(\\theta | X) = \\frac{P(X | \\theta) P(\\theta)}{P(X)}$。観測データ（尤度 $P(X | \\theta)$）が得られた後に、元の仮説（事前確率 $P(\\theta)$）をどのように更新すべきかを数学的に定式化したものです。",
    prob_where: "<strong>重みの初期化：</strong> 勾配消失や勾配爆発を防ぐため、ネットワークの初期重みは計算された正規分布（XavierやHeの初期化など）に基づいてランダムに設定されます。<br><strong>拡散モデル（MidjourneyやDALL-E）：</strong> 高度な画像生成AIは、画像から少しずつノイズを取り除く過程を「マルコフ連鎖」としてモデル化し、ノイズを付加する拡散プロセスを数学的に逆転させています。",

    neu_title: "5. ディープラーニングと誤差逆伝播法",
    neu_why: "単純な線形モデルでは解けない複雑な問題（XOR問題など）を解決するためには、データを多層的に変換して表現する仕組みが必要です。ディープニューラルネットワークは、この「階層的な特徴表現」をデータから自動的に学習します。",
    neu_how: "<strong>フォワードパス（順伝播）：</strong> $\\mathbf{a}^{(l)} = \\sigma(\\mathbf{W}^{(l)} \\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)})$。行列による線形変換の後に、ReLUなどの非線形活性化関数 $\\sigma$ を適用します。<br><strong>バックプロパゲーション（誤差逆伝播法）：</strong> 出力層での誤差を、微積分の「連鎖律（チェインルール）」を用いて入力側へ逆方向に伝播させることで、すべての重みの勾配を効率的に計算します（例：$\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial a} \\frac{\\partial a}{\\partial z} \\frac{\\partial z}{\\partial w}$）。",
    neu_where: "多層パーセプトロン（MLP）とバックプロパゲーションのアルゴリズムは、単純な画像分類から、GPT-4のような超巨大言語モデル、ResNetのような畳み込みニューラルネットワーク（CNN）に至るまで、すべての現代AIの「心臓部」として稼働しています。",

    dh_title: "6. Dahono Labs Gateway",
    dh_where: "このプロジェクトのAIチューター機能は、<strong>Dahono Labs API Gateway</strong> を活用しています。OpenAI APIフォーマットと100%の互換性を持つように設計されており、既存のツールやモデルとシームレスに統合できます。",
    dh_how: "ゲートウェイはインテリジェントなルーターおよびロードバランサーとして機能します。AIMathLabは数学的状態（ベクトル座標、行列の値など）をVercelのサーバーレスエッジ関数を介して <code>dahono/ccai-pro</code> モデルに送信し、APIキーを完全に保護します。その後、Server-Sent Events（SSE）を使用してリアルタイムでブラウザに応答がストリーミングされます。"
  },
  id: {
    hub: "← Beranda",
    maintitle: "Latar Belakang Ilmiah & Referensi",
    maindesc: "Penjelasan mendalam tentang teori matematika yang mendasari Kecerdasan Buatan (AI), menjawab pertanyaan seputar <em>Mengapa</em>, <em>Bagaimana</em>, <em>Di Mana</em>, dan <em>Dari Siapa</em>.",
    
    why: "MENGAPA", how: "BAGAIMANA", where: "DI MANA", who: "DARI SIAPA",
    why_sub: "Latar Belakang Teoretis",
    how_sub: "Mekanisme Matematika",
    where_sub: "Penerapan pada AI Modern",
    who_sub: "Literatur Dasar",

    vec_title: "1. Ruang Vektor & Embedding",
    vec_why: "Dalam machine learning, data yang kita olah hampir tidak pernah berbentuk nilai tunggal (skalar). Gambar, teks, dan audio adalah data berdimensi tinggi. Ruang vektor menyediakan kerangka matematika untuk menghitung jarak, kemiripan, dan besaran dari data-data tersebut. Tanpa ruang vektor, tidak ada cara untuk mendefinisikan \"kemiripan makna\" secara matematis.",
    vec_how: "Sebuah vektor $\\mathbf{v} \\in \\mathbb{R}^n$ merepresentasikan sebuah titik atau arah dalam ruang $n$-dimensi. Operasi perhitungan paling penting dalam AI adalah inner (dot) product: $\\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i=1}^n a_i b_i = \\|\\mathbf{a}\\| \\|\\mathbf{b}\\| \\cos(\\theta)$. Operasi ini menghitung proyeksi dari satu vektor ke vektor lainnya, yang secara langsung mengukur seberapa searah kedua vektor tersebut (cosine similarity).",
    vec_where: "Ruang vektor adalah fondasi utama dari <strong>Word Embeddings (Word2Vec)</strong> dan <strong>Mekanisme Attention pada Transformer</strong>. Dalam Large Language Models (LLM), sebuah kata (token) diubah menjadi vektor $\\mathbf{x} \\in \\mathbb{R}^d$. Nilai 'attention' antara <em>query</em> $\\mathbf{q}$ dan <em>key</em> $\\mathbf{k}$ pada dasarnya dihitung menggunakan hasil dot product yang diskalakan: $\\text{Attention} \\propto \\exp(\\frac{\\mathbf{q} \\cdot \\mathbf{k}}{\\sqrt{d}})$.",
    
    mat_title: "2. Transformasi Matriks & SVD",
    mat_why: "Jaringan saraf (Neural Network) pada dasarnya dibangun dari rangkaian transformasi linier dan fungsi aktivasi non-linier. Matriks sangat efisien dalam merepresentasikan transformasi linier ini. Untuk mempelajari fitur yang kompleks, AI harus memutar, meregangkan, dan memproyeksikan ruang data, di mana semua operasi ini didefinisikan dengan tegas melalui perkalian matriks.",
    mat_how: "Transformasi linier pada data dilakukan melalui persamaan $T(\\mathbf{x}) = \\mathbf{A}\\mathbf{x}$. Sifat dari matriks $\\mathbf{A}$ dapat dibedah sepenuhnya melalui metode <strong>Singular Value Decomposition (SVD)</strong>: $\\mathbf{A} = \\mathbf{U}\\mathbf{\\Sigma}\\mathbf{V}^T$. Teorema ini membuktikan bahwa <em>semua jenis</em> transformasi matriks tidak lain hanyalah kombinasi dari rotasi ($\\mathbf{V}^T$), penskalaan (peregangan) di sumbu ortogonal ($\\mathbf{\\Sigma}$), lalu diikuti dengan rotasi lagi ($\\mathbf{U}$).",
    mat_where: "<strong>Matriks Bobot (Weight Matrices):</strong> Parameter-parameter di dalam lapisan jaringan saraf disimpan dalam bentuk matriks bobot $\\mathbf{W}$.<br><strong>LoRA (Low-Rank Adaptation):</strong> Teknik fine-tuning modern untuk LLM ini berasumsi bahwa perubahan bobot selama pelatihan ($\\Delta \\mathbf{W}$) sebenarnya memiliki dimensi intrinsik yang rendah (low-rank). Memanfaatkan teori SVD, matriks raksasa ini dapat dipecah menjadi perkalian dua matriks kecil $\\mathbf{A}$ dan $\\mathbf{B}$ sehingga jauh lebih ringan dihitung.",

    cal_title: "3. Kalkulus Multivariabel & Optimisasi",
    cal_why: "Model AI tidak otomatis \"tahu\" bobot yang benar sejak awal; mereka harus <em>mencarinya</em> melalui proses belajar. Di sinilah optimisasi berfungsi sebagai kompas. Dengan menganggap proses belajar sebagai upaya meminimalkan fungsi kerugian (Loss Function) $L(\\mathbf{\\theta})$, kalkulus menyediakan vektor gradien $\\nabla L$ yang menunjukkan arah kemiringan paling curam.",
    cal_how: "<strong>Gradient Descent:</strong> Aturan pembaruan parameter dirumuskan sebagai $\\mathbf{\\theta}_{t+1} = \\mathbf{\\theta}_t - \\alpha \\nabla L(\\mathbf{\\theta}_t)$, di mana $\\alpha$ adalah <em>learning rate</em>.<br><strong>Deret Taylor:</strong> Polinomial Taylor $f(x) \\approx f(a) + f'(a)(x-a) + \\frac{f''(a)}{2!}(x-a)^2$ digunakan untuk memperkirakan bentuk lembah kerugian (Loss Landscape). Optimisasi orde pertama (seperti Gradient Descent) hanya menggunakan suku linier, sedangkan metode orde kedua (seperti Metode Newton) menggunakan suku kuadratik.",
    cal_where: "Hampir semua neural network modern dilatih menggunakan turunan dari algoritma Stochastic Gradient Descent (SGD). Salah satu yang paling populer, <strong>Adam Optimizer</strong>, mampu menyesuaikan <em>learning rate</em> secara otomatis untuk tiap parameter berdasarkan perkiraan momen pertama (rata-rata gradien) dan momen kedua (varians gradien).",

    prob_title: "4. Probabilitas, Statistik & Bayes",
    prob_why: "Data di dunia nyata penuh dengan <em>noise</em>, ambigu, dan tidak lengkap. Karena itu, AI jarang memberikan jawaban yang pasti (deterministik), melainkan dalam bentuk probabilitas. Selain itu, proses inisialisasi jaringan dan pemodelan data sangat bergantung pada konsep distribusi statistik untuk menjaga kestabilan matematis selama pelatihan.",
    prob_how: "<strong>Teorema Limit Sentral (CLT):</strong> Jumlah dari $n$ variabel acak independen akan selalu mendekati distribusi Normal $\\mathcal{N}(\\mu, \\sigma^2)$ seiring dengan bertambahnya nilai $n \\to \\infty$.<br><strong>Teorema Bayes:</strong> $P(\\theta | X) = \\frac{P(X | \\theta) P(\\theta)}{P(X)}$. Teorema ini merumuskan secara matematis bagaimana kita harus memperbarui asumsi awal kita (<em>prior</em> $P(\\theta)$) setelah melihat bukti data baru (<em>likelihood</em> $P(X | \\theta)$).",
    prob_where: "<strong>Inisialisasi Bobot:</strong> Untuk mencegah nilai aktivasi meledak atau menghilang (vanishing/exploding gradient), bobot awal jaringan diatur secara acak berdasarkan distribusi normal yang telah diskalakan (misalnya teknik Inisialisasi Xavier atau He).<br><strong>Model Difusi (misal: Midjourney, DALL-E):</strong> AI penghasil gambar tingkat tinggi memodelkan proses iteratif menghapus <em>noise</em> dari gambar sebagai <em>Rantai Markov</em> (Markov Chain), yang secara matematis membalikkan proses difusi maju.",

    neu_title: "5. Deep Learning & Backpropagation",
    neu_why: "Untuk memecahkan masalah yang kompleks dan tidak bisa dipisahkan secara linier (seperti persoalan logika XOR), AI membutuhkan lapisan representasi ganda. Deep Neural Network dirancang agar bisa mempelajari representasi berhierarki ini secara otomatis dari data.",
    neu_how: "<strong>Forward Pass (Propagasi Maju):</strong> $\\mathbf{a}^{(l)} = \\sigma(\\mathbf{W}^{(l)} \\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)})$. Transformasi linier dengan matriks diikuti oleh penerapan fungsi aktivasi non-linier $\\sigma$ (seperti ReLU).<br><strong>Backpropagation (Propagasi Balik):</strong> Nilai gradien dari setiap bobot dihitung secara efisien dari lapisan <em>output</em> mundur ke lapisan <em>input</em> dengan menerapkan Aturan Rantai (Chain Rule) dari kalkulus. Contohnya: $\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial a} \\frac{\\partial a}{\\partial z} \\frac{\\partial z}{\\partial w}$.",
    neu_where: "Algoritma Multilayer Perceptron (MLP) dan Backpropagation adalah \"mesin penggerak\" utama di balik semua sistem deep learning saat ini, mulai dari pengklasifikasi gambar sederhana, arsitektur CNN seperti ResNet, hingga model bahasa raksasa seperti GPT-4.",

    dh_title: "6. Dahono Labs Gateway",
    dh_where: "Fitur AI Tutor dalam proyek ini didukung oleh <strong>Dahono Labs API Gateway</strong>. Gateway ini dirancang agar 100% kompatibel dengan format API OpenAI, yang memungkinkan integrasi yang mulus dengan model dan alat yang sudah ada.",
    dh_how: "Gateway ini berfungsi sebagai router cerdas dan penyeimbang beban (load balancer). AIMathLab mengirimkan state matematika (koordinat vektor, nilai matriks, dll) ke model <code>dahono/ccai-pro</code> melalui Vercel serverless edge function, sehingga API key tetap aman. Respons AI kemudian dialirkan kembali ke browser secara real-time menggunakan Server-Sent Events (SSE)."
  }
};

function updateInfo() {
  const lang = document.body.getAttribute('data-active-lang') || 'en';
  const d = dict[lang];
  if(!d) return;

  document.getElementById('t-hub').innerText = d.hub;
  document.getElementById('t-maintitle').innerHTML = d.maintitle;
  document.getElementById('t-maindesc').innerHTML = d.maindesc;

  document.getElementById('t-vec-title').innerHTML = d.vec_title;
  document.getElementById('t-mat-title').innerHTML = d.mat_title;
  document.getElementById('t-cal-title').innerHTML = d.cal_title;
  document.getElementById('t-prob-title').innerHTML = d.prob_title;
  document.getElementById('t-neu-title').innerHTML = d.neu_title;

  for(let i=1; i<=5; i++) {
    document.getElementById('t-why'+i).innerText = d.why;
    document.getElementById('t-how'+i).innerText = d.how;
    document.getElementById('t-where'+i).innerText = d.where;
    document.getElementById('t-who'+i).innerText = d.who;
  }
  document.getElementById('t-where6').innerText = d.where;
  document.getElementById('t-how6').innerText = d.how;
  
  document.getElementById('t-dh-title').innerHTML = d.dh_title;
  document.getElementById('t-dh-where-sub').innerText = d.where_sub;
  document.getElementById('t-dh-how-sub').innerText = d.how_sub;
  document.getElementById('t-dh-where').innerHTML = d.dh_where;
  document.getElementById('t-dh-how').innerHTML = d.dh_how;

  document.getElementById('t-vec-why-sub').innerText = d.why_sub;
  document.getElementById('t-mat-why-sub').innerText = d.why_sub;
  document.getElementById('t-cal-why-sub').innerText = d.why_sub;
  document.getElementById('t-prob-why-sub').innerText = d.why_sub;
  document.getElementById('t-neu-why-sub').innerText = d.why_sub;

  document.getElementById('t-vec-how-sub').innerText = d.how_sub;
  document.getElementById('t-mat-how-sub').innerText = d.how_sub;
  document.getElementById('t-cal-how-sub').innerText = d.how_sub;
  document.getElementById('t-prob-how-sub').innerText = d.how_sub;
  document.getElementById('t-neu-how-sub').innerText = d.how_sub;

  document.getElementById('t-vec-where-sub').innerText = d.where_sub;
  document.getElementById('t-mat-where-sub').innerText = d.where_sub;
  document.getElementById('t-cal-where-sub').innerText = d.where_sub;
  document.getElementById('t-prob-where-sub').innerText = d.where_sub;
  document.getElementById('t-neu-where-sub').innerText = d.where_sub;

  document.getElementById('t-vec-who-sub').innerText = d.who_sub;
  document.getElementById('t-mat-who-sub').innerText = d.who_sub;
  document.getElementById('t-cal-who-sub').innerText = d.who_sub;
  document.getElementById('t-prob-who-sub').innerText = d.who_sub;
  document.getElementById('t-neu-who-sub').innerText = d.who_sub;

  document.getElementById('t-vec-why').innerHTML = d.vec_why;
  document.getElementById('t-vec-how').innerHTML = d.vec_how;
  document.getElementById('t-vec-where').innerHTML = d.vec_where;
  
  document.getElementById('t-mat-why').innerHTML = d.mat_why;
  document.getElementById('t-mat-how').innerHTML = d.mat_how;
  document.getElementById('t-mat-where').innerHTML = d.mat_where;

  document.getElementById('t-cal-why').innerHTML = d.cal_why;
  document.getElementById('t-cal-how').innerHTML = d.cal_how;
  document.getElementById('t-cal-where').innerHTML = d.cal_where;

  document.getElementById('t-prob-why').innerHTML = d.prob_why;
  document.getElementById('t-prob-how').innerHTML = d.prob_how;
  document.getElementById('t-prob-where').innerHTML = d.prob_where;

  document.getElementById('t-neu-why').innerHTML = d.neu_why;
  document.getElementById('t-neu-how').innerHTML = d.neu_how;
  document.getElementById('t-neu-where').innerHTML = d.neu_where;

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetClear();
    MathJax.typesetPromise().catch((err) => console.error('MathJax error:', err));
  }
}

function toggleLangMenu(e) {
  e.stopPropagation();
  document.getElementById('lang-menu').classList.toggle('show');
}
window.addEventListener('click', () => {
  const m = document.getElementById('lang-menu');
  if(m) m.classList.remove('show');
});

function setLang(lang){
  document.body.setAttribute('data-active-lang',lang);
  document.documentElement.setAttribute('lang',lang==='ja'?'ja':lang==='id'?'id':'en');
  ['en','ja','id'].forEach(l=>document.getElementById('lb-'+l).classList.toggle('active',l===lang));
  localStorage.setItem('aiml-lang',lang);
  updateInfo();
}

async function initLanguage() {
  const storedLang = localStorage.getItem('aiml-lang');
  if (storedLang) {
    setLang(storedLang);
    return;
  }

  let browserLang = navigator.language || navigator.userLanguage;
  if (browserLang) {
    browserLang = browserLang.toLowerCase();
    if (browserLang.startsWith('ja')) { setLang('ja'); return; }
    if (browserLang.startsWith('id')) { setLang('id'); return; }
  }

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.country_code === 'JP') { setLang('ja'); return; }
      if (data.country_code === 'ID') { setLang('id'); return; }
    }
  } catch (e) {
    console.warn("IP language detection failed, defaulting to English.", e);
  }

  setLang('en');
}

setTimeout(initLanguage, 0);