let FALLBACK_IMG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
  '<rect width="800" height="450" fill="#0f172a"/>' +
  '<text x="400" y="225" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">BudgetBasics</text>' +
  '</svg>'
);

document.addEventListener('error', function (e) {
  if (e.target && e.target.tagName === 'IMG' && !e.target.dataset.fallback) {
    e.target.dataset.fallback = 'true';
    e.target.src = FALLBACK_IMG;
  }
}, true);

let charts = {};
let monthlySavingsPlan = 10000;
let currentSavingsBase = 0;

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getThemeValue(name) {
  let isDark = getTheme() === 'dark';
  let map = {
    'card-bg': isDark ? '#1e293b' : '#ffffff',
    'text': isDark ? '#e2e8f0' : '#1e293b',
    'border': isDark ? '#334155' : '#cccccc'
  };
  return map[name] || '';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    $('#themeToggle').text('Light Mode');
  } else {
    document.documentElement.removeAttribute('data-theme');
    $('#themeToggle').text('Dark Mode');
  }

  if (typeof Chart !== 'undefined') {
    let isDark = theme === 'dark';
    Chart.defaults.color = isDark ? '#e2e8f0' : '#1e293b';
    Chart.defaults.borderColor = isDark ? '#334155' : '#cccccc';

    let cardBorder = isDark ? '#1e293b' : '#ffffff';
    for (let id in charts) {
      let ch = charts[id];
      if (!ch) continue;
      if (ch.config.type === 'doughnut') {
        ch.data.datasets[0].borderColor = cardBorder;
      }
      ch.update();
    }
  }

  try { localStorage.setItem('bb-theme', theme); } catch (e) {}
}

function createDoughnut(canvasId, labels, data, colors, tooltipFn) {
  let canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') {
    return null;
  }

  let optionsObj = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '58%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, padding: 12, font: { size: 12 } }
      }
    }
  };

  if (tooltipFn) {
    optionsObj.plugins.tooltip = {
      callbacks: { label: tooltipFn }
    };
  }

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: getThemeValue('card-bg'),
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: optionsObj
  });
}

function createSavingsLine() {
  let canvas = document.getElementById('savingsChart');
  if (!canvas || typeof Chart === 'undefined') {
    return null;
  }

  let points = [];
  for (let i = 1; i <= 12; i++) {
    points.push(currentSavingsBase + monthlySavingsPlan * i);
  }

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'],
      datasets: [{
        label: 'Projected Savings (PKR)',
        data: points,
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.25,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (v) { return 'PKR ' + v.toLocaleString(); }
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function initChart(id) {
  let canvas = document.getElementById(id);
  if (!canvas || canvas.offsetParent === null) {
    return;
  }
  if (charts[id]) {
    charts[id].resize();
    return;
  }

  if (id === 'homeBudgetChart' || id === 'basicsChart') {
    charts[id] = createDoughnut(
      id,
      ['Hostel Share', 'Utilities', 'Campus Meals', 'Transit', 'Savings Buffer'],
      [18000, 4000, 10000, 5000, 8000],
      ['#0f766e', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6'],
      function (ctx) {
        return ctx.label + ': PKR ' + ctx.parsed.toLocaleString();
      }
    );
  } else if (id === 'ruleChart') {
    charts[id] = createDoughnut(
      id,
      ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
      [50, 30, 20],
      ['#0f766e', '#f59e0b', '#3b82f6'],
      function (ctx) {
        let income = parseFloat($('#incomeInput').val()) || 0;
        let amount = income * (ctx.parsed / 100);
        return ctx.label + ': PKR ' + amount.toLocaleString();
      }
    );
  } else if (id === 'savingsChart') {
    charts[id] = createSavingsLine();
  }
}

function renderActiveCharts(container) {
  if (!container) return;
  $(container).find('canvas').each(function () {
    initChart(this.id);
  });
}

function switchSection(targetId, subTabId) {
  $('.menuItem').removeClass('active');
  $('.menuItem').each(function () {
    if ($(this).attr('data-section') === targetId) {
      $(this).addClass('active');
    }
  });

  $('.wholePage').removeClass('visiblePage').hide();

  let targetPage = $('#' + targetId);
  targetPage.addClass('visiblePage').fadeIn(200, function () {
    if (subTabId) {
      targetPage.find('.tabButton[data-sub="' + subTabId + '"]').trigger('click');
    }
    renderActiveCharts(this);
  });

  window.scrollTo(0, 0);
}

$(document).ready(function () {

  let initialTheme = 'light';
  try {
    let saved = localStorage.getItem('bb-theme');
    if (saved === 'dark' || saved === 'light') {
      initialTheme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialTheme = 'dark';
    }
  } catch (e) {}
  applyTheme(initialTheme);

  $('#themeToggle').click(function () {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });

  $('.menuItem').click(function () {
    let section = $(this).attr('data-section');
    switchSection(section);
  });

  $('.footerLink').click(function () {
    let section = $(this).attr('data-section');
    let sub = $(this).attr('data-sub');
    switchSection(section, sub);
  });

  $('.tabButton').click(function () {
    let sub = $(this).attr('data-sub');
    let parentPage = $(this).closest('.wholePage');
    parentPage.find('.tabButton').removeClass('active');
    $(this).addClass('active');
    parentPage.find('.tabPanel').removeClass('active').hide();
    parentPage.find('#' + sub).addClass('active').fadeIn(150, function () {
      renderActiveCharts(this);
    });
  });

  let currentSlide = 0;
  let totalSlides = $('.slideImage').length;
  let sliderTimer;

  function setSlide(idx) {
    $('.slideImage, .smallDot').removeClass('active');
    $('.slideImage[data-slide="' + idx + '"], .smallDot[data-slide="' + idx + '"]').addClass('active');
    currentSlide = idx;
  }

  function startSliderTimer() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(function () {
      setSlide((currentSlide + 1) % totalSlides);
    }, 6000);
  }

  $('.nextArrow').click(function () {
    setSlide((currentSlide + 1) % totalSlides);
    startSliderTimer();
  });

  $('.previousArrow').click(function () {
    setSlide((currentSlide - 1 + totalSlides) % totalSlides);
    startSliderTimer();
  });

  $('.smallDot').click(function () {
    let slideIdx = $(this).attr('data-slide');
    setSlide(slideIdx);
    startSliderTimer();
  });

  startSliderTimer();

  let randomCount = 3140 + Math.floor(Math.random() * 180);
  $('#visitorCount').text(randomCount.toLocaleString());

  function updateTime() {
    let now = new Date();
    $('#clockText').text(now.toLocaleTimeString());
    let dateOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    $('#dateText').text(now.toLocaleDateString(undefined, dateOptions));
  }
  updateTime();
  setInterval(updateTime, 1000);

  $('.sitemapLink').click(function () {
    $('#sitemapBox').slideToggle(180);
  });

  $('.faqHeader').click(function () {
    $(this).siblings('.faqBody').slideToggle(180);
  });

  $('.quizBtn').click(function () {
    let isCorrect = $(this).attr('data-correct') === 'true';
    let feedback = $(this).closest('.knowledgeCheckCard').find('.quizFeedback');
    feedback.removeClass('feedback-correct feedback-wrong');
    if (isCorrect) {
      feedback.addClass('feedback-correct').text('Correct! Library and internet access are recurring, non-negotiable costs required for academic coursework.').fadeIn(150);
    } else {
      feedback.addClass('feedback-wrong').text('Not quite. Because you must pay this fixed amount every semester to access university coursework, it is classified as a Fixed Academic Expense.').fadeIn(150);
    }
  });

  let gameItems = [
    { name: 'Semester Core Textbooks', answer: 'need', note: 'Essential academic study material for exams.' },
    { name: 'Weekend Concert Ticket', answer: 'want', note: 'Discretionary leisure and entertainment.' },
    { name: 'Hostel Room Rent Share', answer: 'need', note: 'Essential shelter and living requirement.' },
    { name: 'Designer Sneakers', answer: 'want', note: 'Branded fashion beyond basic functional footwear.' },
    { name: 'Monthly Campus Transit Pass', answer: 'need', note: 'Required to attend classes reliably.' }
  ];

  let gameHtml = '';
  for (let i = 0; i < gameItems.length; i++) {
    gameHtml += '<div class="cardBox" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;" data-idx="' + i + '">';
    gameHtml += '<span style="font-weight:bold;">' + gameItems[i].name + '</span>';
    gameHtml += '<div>';
    gameHtml += '<button class="commonButton button1 nwBtn" data-choice="need" style="margin-right:6px;">Need</button>';
    gameHtml += '<button class="commonButton button2 nwBtn" data-choice="want">Want</button>';
    gameHtml += '</div>';
    gameHtml += '<div class="nwFeedback" style="width:100%; font-size:0.85rem; display:none; margin-top:4px;"></div>';
    gameHtml += '</div>';
  }
  $('#nwGame').html(gameHtml);

  $('#nwGame').on('click', '.nwBtn', function () {
    let card = $(this).closest('.cardBox');
    let idx = card.attr('data-idx');
    let userChoice = $(this).attr('data-choice');
    let item = gameItems[idx];
    let isCorrect = userChoice === item.answer;

    let feedback = card.find('.nwFeedback');
    feedback.removeClass('feedback-correct feedback-wrong');
    if (isCorrect) {
      feedback.addClass('feedback-correct').text('Correct! ' + item.note).show();
    } else {
      feedback.addClass('feedback-wrong').text('Incorrect. ' + item.note).show();
    }
    card.find('button').prop('disabled', true);
  });

  $('#calcRuleBtn').click(function () {
    let income = parseFloat($('#incomeInput').val());
    if (isNaN(income) || income <= 0) {
      $('#ruleResults').html('<p class="text-danger">Please enter a valid monthly income figure.</p>').fadeIn(150);
      return;
    }

    let needs = (income * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let wants = (income * 0.3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let savings = (income * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let resultHtml = '<p>Needs Allocation (50%): <strong>PKR ' + needs + '</strong></p>' +
                     '<p>Wants Allocation (30%): <strong>PKR ' + wants + '</strong></p>' +
                     '<p>Savings & Buffer (20%): <strong>PKR ' + savings + '</strong></p>' +
                     '<p class="educationalNote">Estimated breakdown for learning purposes only. Actual living expenses may vary.</p>';

    $('#ruleResults').html(resultHtml).fadeIn(150);

    if (charts['ruleChart']) {
      charts['ruleChart'].update();
    }
  });

  $('#calcGoalBtn').click(function () {
    let target = parseFloat($('#goalTarget').val());
    let current = parseFloat($('#goalCurrent').val());
    if (isNaN(current) || current < 0) {
      current = 0;
    }
    let monthly = parseFloat($('#goalMonthly').val());
    let name = $('#goalName').val().trim();
    if (!name) {
      name = 'Target Goal';
    }

    if (isNaN(target) || target <= 0 || isNaN(monthly) || monthly <= 0) {
      $('#goalResults').html('<p class="text-danger">Please fill in valid positive target and monthly amounts.</p>').fadeIn(150);
      return;
    }

    let remaining = Math.max(target - current, 0);
    let months = Math.ceil(remaining / monthly);
    let pct = Math.min((current / target) * 100, 100).toFixed(0);

    let encouragementTip = '';
    if (months <= 3) {
      encouragementTip = 'Outstanding pace! You can hit this goal within the current semester. Automate this transfer on allowance day.';
    } else if (months <= 6) {
      encouragementTip = 'Very realistic target. Saving consistently each month will ensure you achieve this before next semester starts.';
    } else {
      encouragementTip = 'Solid milestone! Consider supplementing your monthly contribution with any freelance or scholarship money to reach it sooner.';
    }

    let escapedName = $('<div>').text(name).html();
    let goalHtml = '<p>Goal: <strong>' + escapedName + '</strong></p>' +
                   '<p>Remaining to Save: <strong>PKR ' + remaining.toLocaleString() + '</strong></p>' +
                   '<p>Estimated Timeline: <strong>' + months + ' month(s)</strong> at PKR ' + monthly.toLocaleString() + '/month.</p>' +
                   '<div class="progressBarOuter">' +
                     '<div class="progressBarInner" style="width:' + pct + '%">' + pct + '%</div>' +
                   '</div>' +
                   '<div class="savingsTipAlert"><strong>Encouraging Tip:</strong> ' + encouragementTip + '</div>';

    $('#goalResults').html(goalHtml).fadeIn(150);

    monthlySavingsPlan = monthly;
    currentSavingsBase = current;
    if (charts['savingsChart']) {
      let updatedPoints = [];
      for (let i = 1; i <= 12; i++) {
        updatedPoints.push(current + monthly * i);
      }
      charts['savingsChart'].data.datasets[0].data = updatedPoints;
      charts['savingsChart'].update();
    }
  });

  let expenses = [];
  let editingIdx = -1;

  function renderExpenseTable() {
    let tbody = $('#expenseTableBody');
    tbody.empty();
    let total = 0;

    for (let i = 0; i < expenses.length; i++) {
      let exp = expenses[i];
      total = total + exp.amount;

      let row = $('<tr>');
      row.append($('<td>').text(exp.date));
      row.append($('<td>').text(exp.category));
      row.append($('<td>').text(exp.desc));
      row.append($('<td>').text('PKR ' + exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })));

      let actionCell = $('<td>');
      actionCell.html('<button class="commonButton buttonEdit expEditBtn" data-idx="' + i + '">Edit</button>' +
                      '<button class="commonButton button3 expDelBtn" data-idx="' + i + '">Delete</button>');
      row.append(actionCell);

      tbody.append(row);
    }

    let budget = parseFloat($('#monthlyBudgetInput').val()) || 0;
    let remaining = budget - total;

    $('#totalExpensesText').text('PKR ' + total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    $('#remainingBalanceText').text('PKR ' + remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    $('#remainingBalanceText').removeClass('text-primary text-danger');
    if (remaining < 0) {
      $('#remainingBalanceText').addClass('text-danger');
    } else {
      $('#remainingBalanceText').addClass('text-primary');
    }
  }

  $('#addExpenseBtn').click(function () {
    let date = $('#expDate').val();
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }
    let category = $('#expCategory').val();
    let desc = $('#expDesc').val().trim();
    let amount = parseFloat($('#expAmount').val());

    if (!desc || isNaN(amount) || amount <= 0) {
      alert('Please provide a valid description and positive amount.');
      return;
    }

    if (editingIdx >= 0) {
      expenses[editingIdx] = { date: date, category: category, desc: desc, amount: amount };
      editingIdx = -1;
      $('#addExpenseBtn').text('Add Expense Entry');
      $('#cancelEditBtn').hide();
    } else {
      expenses.push({ date: date, category: category, desc: desc, amount: amount });
    }

    $('#expDesc').val('');
    $('#expAmount').val('');
    renderExpenseTable();
  });

  $('#expenseTableBody').on('click', '.expEditBtn', function () {
    let idx = parseInt($(this).attr('data-idx'), 10);
    let item = expenses[idx];
    editingIdx = idx;

    $('#expDate').val(item.date);
    $('#expCategory').val(item.category);
    $('#expDesc').val(item.desc);
    $('#expAmount').val(item.amount);

    $('#addExpenseBtn').text('Update Entry');
    $('#cancelEditBtn').show();
  });

  $('#cancelEditBtn').click(function () {
    editingIdx = -1;
    $('#addExpenseBtn').text('Add Expense Entry');
    $('#cancelEditBtn').hide();
    $('#expDesc').val('');
    $('#expAmount').val('');
  });

  $('#expenseTableBody').on('click', '.expDelBtn', function () {
    let idx = parseInt($(this).attr('data-idx'), 10);
    expenses.splice(idx, 1);
    if (editingIdx === idx) {
      editingIdx = -1;
      $('#addExpenseBtn').text('Add Expense Entry');
      $('#cancelEditBtn').hide();
      $('#expDesc').val('');
      $('#expAmount').val('');
    }
    renderExpenseTable();
  });

  $('#monthlyBudgetInput').on('input', renderExpenseTable);
  $('#expDate').val(new Date().toISOString().split('T')[0]);
  renderExpenseTable();

  let allTipsData = [
    { text: 'Review your account balance prior to making non-essential purchases.', category: 'saving', date: '2026-03-01' },
    { text: 'Allocate fixed savings transfers automatically on every allowance disbursement.', category: 'saving', date: '2026-03-05' },
    { text: 'Evaluate monthly digital subscriptions regularly to eliminate unused charges.', category: 'expenses', date: '2026-03-10' },
    { text: 'Maintain a PKR 5,000 cash buffer for unexpected academic and health needs.', category: 'goals', date: '2026-03-12' },
    { text: 'Cook canteen meals in batches to significantly lower monthly food delivery spending.', category: 'needs', date: '2026-03-15' },
    { text: 'Utilise student identification for discounts on transit passes and software.', category: 'budgeting', date: '2026-03-18' }
  ];

  let currentCategoryFilter = 'all';

  function filterAndSortTips() {
    let query = $('#tipSearchInput').val().toLowerCase().trim();
    let sortVal = $('#tipSortSelect').val();

    let result = [];
    for (let i = 0; i < allTipsData.length; i++) {
      let t = allTipsData[i];
      let matchesCategory = (currentCategoryFilter === 'all') || (t.category === currentCategoryFilter);
      let matchesQuery = (!query) || (t.text.toLowerCase().indexOf(query) !== -1) || (t.category.indexOf(query) !== -1);

      if (matchesCategory && matchesQuery) {
        result.push(t);
      }
    }

    if (sortVal === 'az') {
      result.sort(function (a, b) {
        return a.text.localeCompare(b.text);
      });
    } else if (sortVal === 'newest') {
      result.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });
    }

    let outputHtml = '';
    for (let j = 0; j < result.length; j++) {
      outputHtml += '<div class="tipBox">';
      outputHtml += '<span class="infoCardBadge">' + result[j].category.toUpperCase() + '</span>';
      outputHtml += '<p style="margin:4px 0 0 0;">' + result[j].text + '</p>';
      outputHtml += '</div>';
    }

    $('#filterTipsGrid').html(outputHtml);
    if (result.length === 0) {
      $('#filterEmptyMsg').show();
    } else {
      $('#filterEmptyMsg').hide();
    }
  }

  $('#tipCategoryPills').on('click', '.pillBtn', function () {
    $('#tipCategoryPills .pillBtn').removeClass('active');
    $(this).addClass('active');
    currentCategoryFilter = $(this).attr('data-category');
    filterAndSortTips();
  });

  $('#tipSearchInput').on('input', filterAndSortTips);
  $('#tipSortSelect').on('change', filterAndSortTips);
  filterAndSortTips();

  let infographicsData = [
    { title: 'The Monthly Budget Loop', topic: 'budgeting', desc: 'A sustainable budget runs in four distinct phases: income verification on day one, pre-allocated bucket transfers, daily spend recording, and an end-of-month review to calibrate for next month.' },
    { title: '52-Week Micro Savings Curve', topic: 'savings', desc: 'Setting aside just PKR 500 each week compounds into a dependable emergency safety net of over PKR 26,000 within a single university year without pinching daily needs.' },
    { title: '50-30-20 Rule Blueprint', topic: 'budgeting', desc: 'Balancing 50% essentials (rent, transport, tuition), 30% discretionary wants (cafes, entertainment), and 20% future savings adapts cleanly across any allowance level in Pakistan.' },
    { title: 'Wants vs Needs 48-Hour Scale', topic: 'habits', desc: 'Distinguishing immediate survival requirements from optional comforts using a 48-hour delay rule prevents lifestyle creep and keeps semester balances healthy.' }
  ];

  function renderInfographics(topic) {
    let items = [];
    for (let i = 0; i < infographicsData.length; i++) {
      if (topic === 'all' || infographicsData[i].topic === topic) {
        items.push({ data: infographicsData[i], idx: i });
      }
    }

    let gridHtml = '';
    for (let j = 0; j < items.length; j++) {
      let card = items[j].data;
      gridHtml += '<div class="cardBox infoCardBox" data-idx="' + items[j].idx + '">';
      gridHtml += '<span class="infoCardBadge">' + card.topic.toUpperCase() + '</span>';
      gridHtml += '<h4 style="margin:6px 0 4px 0;">' + card.title + '</h4>';
      gridHtml += '<p class="text-muted" style="font-size:0.85rem; margin:0;">Click to view concept breakdown</p>';
      gridHtml += '</div>';
    }
    $('#infoGrid').html(gridHtml);
  }
  renderInfographics('all');

  $('#infoPills').on('click', '.pillBtn', function () {
    $('#infoPills .pillBtn').removeClass('active');
    $(this).addClass('active');
    let selectedTopic = $(this).attr('data-topic');
    renderInfographics(selectedTopic);
  });

  $('#infoGrid').on('click', '.infoCardBox', function () {
    let idx = $(this).attr('data-idx');
    let card = infographicsData[idx];
    $('#modalTitle').text(card.title);
    $('#modalBody').text(card.desc);
    $('#modalOverlay').css('display', 'flex').hide().fadeIn(150);
  });

  $('#modalCloseBtn, #modalOverlay').click(function (e) {
    if (e.target.id === 'modalCloseBtn' || e.target.id === 'modalOverlay') {
      $('#modalOverlay').fadeOut(150);
    }
  });

  $('#privacyCloseBtn, #privacyModal').click(function (e) {
    if (e.target.id === 'privacyCloseBtn' || e.target.id === 'privacyModal') {
      $('#privacyModal').fadeOut(150);
    }
  });

  $('#disclaimerCloseBtn, #disclaimerModal').click(function (e) {
    if (e.target.id === 'disclaimerCloseBtn' || e.target.id === 'disclaimerModal') {
      $('#disclaimerModal').fadeOut(150);
    }
  });

  $('#openPrivacyLink').click(function () {
    $('#privacyModal').css('display', 'flex').hide().fadeIn(150);
  });

  $('#openDisclaimerLink').click(function () {
    $('#disclaimerModal').css('display', 'flex').hide().fadeIn(150);
  });

  let botKnowledge = [
    { keys: ['need'], text: 'A need is an absolute essential for health, housing, or academic coursework (such as hostel rent, transit pass, or lab manuals).' },
    { keys: ['want'], text: 'A want is a discretionary item that brings enjoyment or comfort (such as dining out, video games, or designer accessories) that can be postponed.' },
    { keys: ['save', 'saving', 'how much'], text: 'We recommend saving at least 15% to 20% of your allowance on the day you receive it, before spending on non-essentials.' },
    { keys: ['50', '30', '20'], text: 'The 50-30-20 rule divides your income: 50% for vital needs, 30% for personal wants, and 20% dedicated to savings.' },
    { keys: ['overspend', 'avoid'], text: 'To avoid overspending, withdraw your weekly variable cash every Monday and enforce a 24-hour waiting rule for impulse buys.' },
    { keys: ['budget', 'start'], text: 'Start by writing down your total monthly allowance, subtract fixed hostel bills first, and divide the rest over 4 weeks.' },
    { keys: ['hi', 'hello', 'hey'], text: 'Hello! I am BudgetAssistant. Ask me about 50-30-20 splits, saving tips, or identifying needs vs wants.' }
  ];

  function getAssistantReply(text) {
    let lowerText = text.toLowerCase();
    for (let i = 0; i < botKnowledge.length; i++) {
      let keys = botKnowledge[i].keys;
      for (let k = 0; k < keys.length; k++) {
        if (lowerText.indexOf(keys[k]) !== -1) {
          return botKnowledge[i].text;
        }
      }
    }
    return "I am here to help with student budgeting! Try asking 'What is a need?', 'How much should I save?', or 'How do I avoid overspending?'.";
  }

  $('#aiToggleBtn').click(function () {
    $('#aiWidget').toggleClass('opened');
    if ($('#aiWidget').hasClass('opened')) {
      setTimeout(function () {
        $('#chatInput').trigger('focus');
      }, 150);
    }
  });

  $('#aiPanelClose').click(function () {
    $('#aiWidget').removeClass('opened');
  });

  function sendChatMessage() {
    let msg = $('#chatInput').val().trim();
    if (!msg) return;

    let escapedMsg = $('<div>').text(msg).html();
    $('#chatWindow').append('<div class="chatBubble userBubble">' + escapedMsg + '</div>');
    $('#chatInput').val('');
    $('#chatWindow').scrollTop($('#chatWindow')[0].scrollHeight);

    let typingElement = $('<div class="chatBubble botBubble" style="opacity:0.6;">BudgetAssistant is typing...</div>');
    $('#chatWindow').append(typingElement);
    $('#chatWindow').scrollTop($('#chatWindow')[0].scrollHeight);

    setTimeout(function () {
      typingElement.remove();
      let reply = getAssistantReply(msg);
      $('#chatWindow').append('<div class="chatBubble botBubble">' + reply + '</div>');
      $('#chatWindow').scrollTop($('#chatWindow')[0].scrollHeight);
    }, 400);
  }

  $('#chatAskBtn').click(sendChatMessage);
  $('#chatInput').keypress(function (e) {
    if (e.which === 13) {
      sendChatMessage();
    }
  });

  $('#quickQuestions').on('click', '.quickQuestionButton', function () {
    let q = $(this).attr('data-question');
    $('#chatInput').val(q);
    sendChatMessage();
  });

  $('#feedbackForm').submit(function (e) {
    e.preventDefault();
    let name = $('#fbName').val().trim();
    let email = $('#fbEmail').val().trim();
    let comments = $('#fbComments').val().trim();
    let rating = $('input[name="fbRating"]:checked').val();
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    $('#errName, #errEmail, #errRating, #errComments').hide();
    let isValid = true;

    if (!name) {
      $('#errName').show();
      isValid = false;
    }
    if (!emailRegex.test(email)) {
      $('#errEmail').show();
      isValid = false;
    }
    if (!rating) {
      $('#errRating').show();
      isValid = false;
    }
    if (!comments) {
      $('#errComments').show();
      isValid = false;
    }

    if (!isValid) return;

    $('#fbSuccess').fadeIn(200);
    $('#feedbackForm')[0].reset();
  });

  $('#contactForm').submit(function (e) {
    e.preventDefault();
    let name = $('#ctName').val().trim();
    let email = $('#ctEmail').val().trim();
    let subject = $('#ctSubject').val().trim();
    let message = $('#ctMessage').val().trim();
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    $('#errCtName, #errCtEmail, #errCtSubject, #errCtMessage').hide();
    let isValid = true;

    if (!name) {
      $('#errCtName').show();
      isValid = false;
    }
    if (!emailRegex.test(email)) {
      $('#errCtEmail').show();
      isValid = false;
    }
    if (!subject) {
      $('#errCtSubject').show();
      isValid = false;
    }
    if (!message) {
      $('#errCtMessage').show();
      isValid = false;
    }

    if (!isValid) return;

    $('#ctSuccess').fadeIn(200);
    $('#contactForm')[0].reset();
  });

  $('#yearText').text(new Date().getFullYear());
  renderActiveCharts(document.getElementById('home'));

});