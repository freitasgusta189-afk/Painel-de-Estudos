const STORAGE_KEYS = {
  SUBJECTS: "studyboard_subjects",
  THEME: "studyboard_theme",
};

let subjects = [];
let chart = null;

// ELEMENTOS
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");
const subjectForm = document.getElementById("subject-form");
const lists = document.querySelectorAll(".subject-list");
const totalSubjectsEl = document.getElementById("total-subjects");
const totalHoursEl = document.getElementById("total-hours");
const toggleThemeBtn = document.getElementById("toggle-theme");
const clearDataBtn = document.getElementById("clear-data");

// NAVEGAÇÃO
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    sections.forEach((section) => {
      section.classList.toggle("active", section.id === target);
    });
  });
});

// TEMA FUNCIONANDO
function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  document.body.className = savedTheme === 'light' ? 'light' : '';
  toggleThemeBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
}

toggleThemeBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(STORAGE_KEYS.THEME, isLight ? "light" : "dark");
  toggleThemeBtn.textContent = isLight ? "🌙" : "☀️";
  
  // Atualiza gráfico
  if (chart) {
    setTimeout(render, 100);
  }
});

// DADOS
function loadSubjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    subjects = data ? JSON.parse(data) : [];
  } catch (e) {
    subjects = [];
  }
}

function saveSubjects() {
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
}

// RENDER
function render() {
  // Stats
  totalSubjectsEl.textContent = subjects.length;
  const totalHours = subjects.reduce((sum, s) => sum + Number(s.goal || 0), 0);
  totalHoursEl.textContent = totalHours + 'h';

  // Listas
  lists.forEach(list => {
    list.innerHTML = subjects.length ? "" : '<li class="empty-state">Nenhuma matéria</li>';
    subjects.forEach(subject => {
      const li = document.createElement("li");
      li.className = "subject-item";
      li.innerHTML = `
        <div class="subject-info">
          <span class="subject-name">${subject.name}</span>
          <span class="subject-meta">${subject.goal}h/semana</span>
        </div>
        <button class="delete-btn" onclick="deleteSubject(${subject.id})">Remover</button>
      `;
      list.appendChild(li);
    });
  });

  // GRÁFICO - só cria se tem dados E canvas pronto
  const canvas = document.getElementById('subjectsChart');
  if (canvas && window.Chart && subjects.length > 0) {
    if (chart) chart.destroy();
    
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width - 48;  // padding
    canvas.height = rect.height - 48;
    
    const ctx = canvas.getContext('2d');
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: subjects.map(s => s.name),
        datasets: [{
          data: subjects.map(s => s.goal),
          backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        }]
      },
      options: {
        responsive: false,  // Fix tamanho
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { 
              color: document.body.classList.contains('light') ? '#1e293b' : 'white',
              padding: 20,
              font: { size: 14 }
            }
          }
        }
      }
    });
  }
}

function addSubject(name, goal) {
  subjects.push({ id: Date.now(), name, goal: Number(goal) });
  saveSubjects();
  render();
}

function deleteSubject(id) {
  subjects = subjects.filter(s => s.id !== id);
  saveSubjects();
  render();
}

// FORM
subjectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nameInput = document.getElementById("name");
  const goalInput = document.getElementById("goal");
  const name = nameInput.value.trim();
  const goal = goalInput.value;
  if (!name || !goal) return alert("Preencha todos os campos");
  addSubject(name, goal);
  nameInput.value = goalInput.value = "";
});

// LIMPAR
clearDataBtn.addEventListener("click", () => {
  if (confirm("Apagar TUDO?")) {
    subjects = [];
    localStorage.clear();
    if (chart) chart.destroy();
    chart = null;
    render();
  }
});

// INICIALIZAÇÃO
window.addEventListener('load', () => {
  loadTheme();
  loadSubjects();
  setTimeout(render, 200);  // Espera layout carregar
});
