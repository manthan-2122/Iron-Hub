document.addEventListener('DOMContentLoaded', function () {
    // ── Session Guard (back-button protection) ───────────
    fetch('/api/session/check').then(r => r.json()).then(d => {
        if (!d.logged_in || d.role !== 'user') window.location.replace('/');
    });

    // ===== Hamburger Menu Toggle =====
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    const toggleMenu = () => {
        sidebar.classList.toggle('open');
        menuToggle.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    };

    const closeMenu = () => {
        sidebar.classList.remove('open');
        menuToggle.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMenu);
    }

    // Close menu when clicking nav links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                closeMenu();
            }
        });
    });

    // Close menu on window resize if screen becomes larger
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            closeMenu();
        }
    });

    // ===== Table Scroll Hint =====
    const addScrollHints = () => {
        const tableContainers = document.querySelectorAll('.table-container');
        tableContainers.forEach(container => {
            const table = container.querySelector('table');
            if (table && table.offsetWidth > container.offsetWidth) {
                container.classList.add('show-scroll-hint');
                
                // Remove hint after first scroll
                container.addEventListener('scroll', function removeHint() {
                    container.classList.remove('show-scroll-hint');
                    container.removeEventListener('scroll', removeHint);
                }, { once: true });
            }
        });
    };

    // Check for scroll hints on load and resize
    window.addEventListener('load', addScrollHints);
    window.addEventListener('resize', addScrollHints);
    
    // Re-check after dynamic content loads
    setTimeout(addScrollHints, 1000);

    // ===== Utilities =====
    const showToast = (message, type = 'info', duration = 3500) => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('dismissing');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    };

    const parseJsonResponse = async (res) => {
        const text = await res.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch (err) {
            return { error: text.trim() || res.statusText || 'Invalid server response' };
        }
    };

    // ===== Dashboard Stats =====
    const fmtDuration = (s) => {
        const m = Math.floor(s / 60), sec = s % 60;
        return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    };

    const updateDashboardStats = async (history, weight) => {
        const totalCal  = history.reduce((sum, h) => sum + (Number(h.calories_burned) || 0), 0);
        const totalSecs = history.reduce((sum, h) => {
            const s = h.duration_seconds != null ? Number(h.duration_seconds)
                    : h.duration_minutes  != null ? Number(h.duration_minutes) * 60 : 0;
            return sum + s;
        }, 0);
        const calEl    = document.getElementById('stat-calories');
        const timeEl   = document.getElementById('stat-workout-time');
        const weightEl = document.getElementById('stat-weight');
        if (calEl)    calEl.textContent    = totalCal  ? totalCal + ' kcal' : '--';
        if (timeEl)   timeEl.textContent   = totalSecs ? fmtDuration(totalSecs) : '--';
        
        // Get today's weight from measurements
        if (weightEl) {
            try {
                const res = await fetch('/api/user/measurements/today', { credentials: 'same-origin' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.weight) {
                        weightEl.textContent = data.weight + ' kg';
                    } else {
                        weightEl.textContent = '--';
                    }
                } else {
                    weightEl.textContent = '--';
                }
            } catch (e) {
                console.error('Error fetching today weight:', e);
                weightEl.textContent = '--';
            }
        }
    };

    // ===== Current Date =====
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // ===== Auth Guard =====
    // BYPASSED FOR TESTING - Uncomment below to enable authentication
    /*
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '../login/user_login.html';
        return;
    }
    */

    // ===== Navigation =====
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.dashboard-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('href').substring(1);
            sections.forEach(s => s.classList.toggle('active', s.id === targetId));
            const titles = { profile: 'My Profile', workouts: 'My Workouts', diet: 'Diet Plan', progress: 'My Progress', subscription: 'Subscription Plans', settings: 'Settings' };
            const h = document.querySelector('.welcome-text h1');
            if (h) {
                if (targetId === 'dashboard') {
                    const firstName = document.getElementById('p_fname')?.value || 'User';
                    h.textContent = `Welcome back, ${firstName}!`;
                } else if (titles[targetId]) {
                    h.textContent = titles[targetId];
                }
            }
        });
    });

    const profileHeader = document.querySelector('.user-profile');
    if (profileHeader) {
        profileHeader.addEventListener('click', () => {
            sections.forEach(s => s.classList.toggle('active', s.id === 'profile'));
            navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#profile'));
            const h = document.querySelector('.welcome-text h1');
            if (h) h.textContent = 'My Profile';
        });
    }

    // ===== Workout Timer System =====
    const CIRCUMFERENCE = 2 * Math.PI * 100; // 628.318
    let timerInterval = null;
    let timerPaused = false;
    let timerSecondsLeft = 0;
    let timerTotalSeconds = 0;
    let currentTimerPlanId = null;
    let currentTimerCalories = 0;

    const playCompletionSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.4);
            });
        } catch (e) { console.warn('Audio not supported', e); }
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const updateTimerUI = () => {
        document.getElementById('timer-display').textContent = formatTime(timerSecondsLeft);
        const progress = timerTotalSeconds > 0 ? (timerSecondsLeft / timerTotalSeconds) : 0;
        document.getElementById('timer-ring').setAttribute('stroke-dashoffset', CIRCUMFERENCE * (1 - progress));
    };

    const finishWorkout = async (elapsedSeconds, isComplete = true) => {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('timer-modal').style.display = 'none';
        if (isComplete) playCompletionSound();

        const workoutName = document.getElementById('timer-workout-name').textContent.replace('🏋️ ', '');
        const caloriesBurned = Math.round(currentTimerCalories * (elapsedSeconds / timerTotalSeconds));
        
        console.log('📝 Logging workout to history:', {
            workout_plan_id: currentTimerPlanId,
            workout_name: workoutName,
            duration_seconds: elapsedSeconds,
            duration_minutes: Math.round(elapsedSeconds / 60),
            calories_burned: caloriesBurned,
            completed: isComplete,
            update_if_exists: true
        });

        if (currentTimerPlanId) {
            try {
                const res = await fetch('/api/user/workout-history', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        workout_plan_id: currentTimerPlanId,
                        workout_name: workoutName,
                        duration_seconds: elapsedSeconds,
                        duration_minutes: Math.round(elapsedSeconds / 60),
                        calories_burned: caloriesBurned,
                        completed: isComplete,
                        update_if_exists: true
                    })
                });
                
                if (res.ok) {
                    const result = await res.json();
                    console.log('✅ Workout logged successfully:', result);
                    
                    if (isComplete) {
                        fetch(`/api/user/workout-progress/${currentTimerPlanId}`, { 
                            method: 'DELETE', 
                            credentials: 'same-origin' 
                        }).catch(() => {});
                    } else {
                        await fetch('/api/user/workout-progress', {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                plan_id: currentTimerPlanId, 
                                seconds_remaining: timerSecondsLeft 
                            })
                        }).catch(() => {});
                    }
                } else {
                    const error = await res.json();
                    console.error('❌ Failed to log workout:', error);
                    showToast('Failed to save workout history: ' + (error.error || 'Unknown error'), 'error');
                }
            } catch (e) {
                console.error('❌ Network error logging workout:', e);
                showToast('Network error while saving workout history', 'error');
            }
        }
        
        await loadWorkouts();
        
        const fmtSec = (s) => { const m = Math.floor(s/60), sec = s%60; return m > 0 ? `${m}m ${sec}s` : `${sec}s`; };
        const statusMsg = isComplete
            ? `🎉 Workout complete! ${fmtSec(elapsedSeconds)} logged to history.`
            : `⏸️ Workout stopped. ${fmtSec(elapsedSeconds)} logged to history as incomplete.`;
        showToast(statusMsg, isComplete ? 'success' : 'warning', 5000);
    };

    const startTimer = async (planId, name, durationMins, calories) => {
        currentTimerPlanId = planId;
        currentTimerCalories = calories;
        timerTotalSeconds = durationMins * 60;
        timerPaused = false;

        // Check for saved progress
        let resumeFrom = timerTotalSeconds;
        try {
            const res = await fetch(`/api/user/workout-progress/${planId}`, { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json();
                if (data.seconds_remaining && data.seconds_remaining > 0) {
                    resumeFrom = data.seconds_remaining;
                }
            }
        } catch (e) {}

        timerSecondsLeft = resumeFrom;
        const isResuming = resumeFrom < timerTotalSeconds;

        document.getElementById('timer-workout-name').textContent = `🏋️ ${name}`;
        document.getElementById('timer-label').textContent = isResuming ? 'remaining (resumed)' : 'remaining';
        document.getElementById('timer-status-text').textContent = isResuming ? 'Resuming from where you left off 💪' : 'Stay focused 💪';
        document.getElementById('timer-pause-btn').textContent = '⏸️ Pause';
        updateTimerUI();
        document.getElementById('timer-modal').style.display = 'flex';

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!timerPaused) {
                timerSecondsLeft--;
                updateTimerUI();
                if (timerSecondsLeft <= 0) {
                    finishWorkout(timerTotalSeconds);
                }
            }
        }, 1000);
    };

    // Pause / Resume
    document.getElementById('timer-pause-btn')?.addEventListener('click', () => {
        timerPaused = !timerPaused;
        document.getElementById('timer-pause-btn').textContent = timerPaused ? '▶️ Resume' : '⏸️ Pause';
        document.getElementById('timer-status-text').textContent = timerPaused ? 'Paused — take a breather 😌' : 'Stay focused 💪';
    });

    // Finish Early
    document.getElementById('timer-stop-btn')?.addEventListener('click', () => {
        const elapsedSec = timerTotalSeconds - timerSecondsLeft;
        const m = Math.floor(elapsedSec / 60), s = elapsedSec % 60;
        const display = m > 0 ? `${m}m ${s}s` : `${s}s`;
        if (confirm(`Stop workout after ${display}? Your progress will be saved and you can resume later.`)) {
            finishWorkout(elapsedSec, false);
        }
    });

    // Prevent accidental close
    document.getElementById('timer-close-btn')?.addEventListener('click', () => {
        if (confirm('Stop the workout timer?')) {
            const elapsedMin = Math.max(1, Math.round((timerTotalSeconds - timerSecondsLeft) / 60));
            finishWorkout(elapsedMin);
        }
    });

    // Start button delegation (on workout cards and today's list)
    document.body.addEventListener('click', e => {
        const btn = e.target;
        if (btn.classList.contains('workout-action') && btn.textContent.trim() === 'Start') {
            const planId = btn.dataset.planId;
            const card = btn.closest('.stat-card') || btn.closest('.workout-item');
            const name = card?.querySelector('h3, .workout-title')?.textContent || 'Workout';
            // Try to extract duration from card text
            const metaText = card?.textContent || '';
            const durMatch = metaText.match(/(\d+)\s*min/);
            const calMatch = metaText.match(/(\d+)\s*kcal/);
            const duration = durMatch ? parseInt(durMatch[1]) : 30;
            const calories = calMatch ? parseInt(calMatch[1]) : 200;
            startTimer(planId, name, duration, calories);
        }
    });

    // ===== Logout =====
    document.querySelector('.logout-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/logout';
        }
    });

    // ===== API Loaders =====
    const loadMeasurements = async () => {
        try {
            const res = await fetch('/api/user/measurements', { credentials: 'same-origin' });
            if (!res.ok) return;
            const measurements = await res.json();
            const tbody = document.getElementById('measurements-tbody');
            if (tbody) {
                if (measurements.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No measurements logged yet. Click "+ Log New Entry" to start tracking!</td></tr>';
                } else {
                    tbody.innerHTML = measurements.map(m => `<tr style="border-bottom:1px solid #e2e8f0;transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                        <td style="padding:1rem;font-weight:500;">${new Date(m.logged_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td style="padding:1rem;font-weight:600;color:#1e293b;">${m.weight} kg</td>
                        <td style="padding:1rem;">${m.body_fat ? m.body_fat + '%' : '—'}</td>
                        <td style="padding:1rem;">${m.chest ? m.chest + ' cm' : '—'}</td>
                        <td style="padding:1rem;">${m.waist ? m.waist + ' cm' : '—'}</td>
                        <td style="padding:1rem;">${m.hips ? m.hips + ' cm' : '—'}</td>
                    </tr>`).join('');
                }
            }
        } catch (e) { console.error(e); }
    };

    const loadStreak = async () => {
        try {
            const res = await fetch('/api/user/measurements/streak', { credentials: 'same-origin' });
            if (!res.ok) return;
            const data = await res.json();
            const streakElement = document.querySelector('.section-card h3[style*="font-size: 4rem"]');
            if (streakElement) {
                streakElement.textContent = data.streak || 0;
            }
        } catch (e) { console.error(e); }
    };

    const measurementForm = document.getElementById('measurement-form');
    const measurementContainer = document.getElementById('measurement-form-container');
    document.getElementById('log-measurement-btn')?.addEventListener('click', () => { if (measurementContainer) measurementContainer.style.display = 'block'; });
    document.getElementById('cancel-measurement')?.addEventListener('click', () => { if (measurementContainer) measurementContainer.style.display = 'none'; measurementForm?.reset(); });
    measurementForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const weight = document.getElementById('m_weight').value;
        const body_fat = document.getElementById('m_body_fat').value || null;
        const chest = document.getElementById('m_chest').value || null;
        const waist = document.getElementById('m_waist').value || null;
        const hips = document.getElementById('m_hips').value || null;
        const logged_date = new Date().toISOString().split('T')[0];
        
        try {
            const res = await fetch('/api/user/measurements', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weight, body_fat, chest, waist, hips, logged_date })
            });
            if (res.ok) {
                measurementContainer.style.display = 'none';
                measurementForm.reset();
                loadMeasurements();
                loadStreak();
                showToast('💾 Measurement logged successfully!', 'success');
            } else {
                const err = await res.json();
                showToast('Error: ' + (err.error || 'Failed to save'), 'error');
            }
        } catch (e) {
            showToast('Network error.', 'error');
            console.error(e);
        }
    });

    // ===== Diet Plan: Veg / Non-Veg =====
    let currentDietType = 'veg';

    const mealData = {
        veg: {
            Monday: { breakfast: { name: 'Poha with Peanuts & Lemon', cal: 320, protein: 8, carb: 52 }, lunch: { name: 'Rajma Chawal, Raita', cal: 520, protein: 18, carb: 72 }, dinner: { name: 'Palak Paneer, Roti, Salad', cal: 480, protein: 22, carb: 42 } },
            Tuesday: { breakfast: { name: 'Idli Sambar with Chutney', cal: 290, protein: 9, carb: 54 }, lunch: { name: 'Chole Bhature, Onion Salad', cal: 580, protein: 16, carb: 68 }, dinner: { name: 'Mixed Veg Curry, Brown Rice', cal: 440, protein: 14, carb: 62 } },
            Wednesday: { breakfast: { name: 'Oats Upma with Vegetables', cal: 280, protein: 10, carb: 46 }, lunch: { name: 'Dal Tadka, Jeera Rice', cal: 490, protein: 20, carb: 66 }, dinner: { name: 'Paneer Tikka, Naan, Raita', cal: 520, protein: 24, carb: 48 } },
            Thursday: { breakfast: { name: 'Moong Dal Chilla, Mint Chutney', cal: 260, protein: 14, carb: 38 }, lunch: { name: 'Aloo Gobi, Roti, Dal', cal: 470, protein: 16, carb: 64 }, dinner: { name: 'Veg Biryani, Boondi Raita', cal: 510, protein: 14, carb: 72 } },
            Friday: { breakfast: { name: 'Masala Dosa, Sambar', cal: 350, protein: 10, carb: 56 }, lunch: { name: 'Kadhi Pakora, Steamed Rice', cal: 500, protein: 14, carb: 68 }, dinner: { name: 'Mushroom Matar, Roti, Salad', cal: 420, protein: 16, carb: 50 } },
            Saturday: { breakfast: { name: 'Besan Chilla with Curd', cal: 300, protein: 16, carb: 36 }, lunch: { name: 'Pav Bhaji, Onion Rings', cal: 540, protein: 12, carb: 74 }, dinner: { name: 'Paneer Butter Masala, Naan', cal: 560, protein: 22, carb: 52 } },
            Sunday: { breakfast: { name: 'Aloo Paratha, Curd, Pickle', cal: 380, protein: 10, carb: 54 }, lunch: { name: 'Veg Pulao, Dal Fry, Papad', cal: 500, protein: 18, carb: 70 }, dinner: { name: 'Malai Kofta, Jeera Rice', cal: 540, protein: 16, carb: 64 } }
        },
        nonveg: {
            Monday: { breakfast: { name: 'Egg Bhurji, Toast, Juice', cal: 380, protein: 22, carb: 34 }, lunch: { name: 'Chicken Curry, Rice, Raita', cal: 580, protein: 36, carb: 58 }, dinner: { name: 'Grilled Fish, Salad, Roti', cal: 420, protein: 38, carb: 28 } },
            Tuesday: { breakfast: { name: 'Boiled Eggs, Brown Bread', cal: 310, protein: 20, carb: 30 }, lunch: { name: 'Mutton Rogan Josh, Naan', cal: 620, protein: 34, carb: 52 }, dinner: { name: 'Chicken Stir Fry, Brown Rice', cal: 480, protein: 32, carb: 48 } },
            Wednesday: { breakfast: { name: 'Omelette, Multigrain Toast', cal: 340, protein: 18, carb: 32 }, lunch: { name: 'Fish Curry, Steamed Rice', cal: 500, protein: 30, carb: 56 }, dinner: { name: 'Tandoori Chicken, Salad, Roti', cal: 460, protein: 40, carb: 32 } },
            Thursday: { breakfast: { name: 'Egg Paratha, Curd', cal: 400, protein: 16, carb: 44 }, lunch: { name: 'Butter Chicken, Jeera Rice', cal: 620, protein: 34, carb: 54 }, dinner: { name: 'Prawn Masala, Lemon Rice', cal: 480, protein: 28, carb: 52 } },
            Friday: { breakfast: { name: 'Scrambled Eggs, Avocado Toast', cal: 420, protein: 20, carb: 36 }, lunch: { name: 'Chicken Biryani, Raita', cal: 600, protein: 32, carb: 68 }, dinner: { name: 'Grilled Chicken Breast, Quinoa', cal: 440, protein: 42, carb: 38 } },
            Saturday: { breakfast: { name: 'French Toast, Bacon Strips', cal: 450, protein: 18, carb: 42 }, lunch: { name: 'Keema Matar, Roti, Onion', cal: 560, protein: 30, carb: 50 }, dinner: { name: 'Fish Tikka, Naan, Mint Chutney', cal: 490, protein: 34, carb: 44 } },
            Sunday: { breakfast: { name: 'Masala Omelette, Paratha', cal: 410, protein: 20, carb: 40 }, lunch: { name: 'Hyderabadi Biryani, Mirchi Ka Salan', cal: 640, protein: 32, carb: 72 }, dinner: { name: 'Chicken Tikka Masala, Naan', cal: 560, protein: 36, carb: 50 } }
        }
    };

    const dayIcons = { Monday: '📅', Tuesday: '📅', Wednesday: '📅', Thursday: '📅', Friday: '📅', Saturday: '🌟', Sunday: '🌟' };
    const mealIcons = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️' };
    const nutriBadge = (cal, protein, carb) => `<div style="display:flex;gap:8px;margin-top:5px;flex-wrap:wrap">
        <span style="font-size:0.72rem;font-weight:600;background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:20px">🔥 ${cal} kcal</span>
        <span style="font-size:0.72rem;font-weight:600;background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:20px">💪 ${protein}g</span>
        <span style="font-size:0.72rem;font-weight:600;background:#fefce8;color:#a16207;padding:2px 8px;border-radius:20px">🌾 ${carb}g</span>
    </div>`;

    const renderMealGrid = (type) => {
        const grid = document.getElementById('meal-plan-grid');
        if (!grid) return;
        const meals = mealData[type];
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const accentColor = type === 'veg' ? '#16a34a' : '#dc2626';
        const accentBg = type === 'veg' ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)';

        // Show day list first
        grid.innerHTML = Object.keys(meals).map(day => {
            const isToday = day === todayName;
            const d = meals[day];
            const totalCal = d.breakfast.cal + d.lunch.cal + d.dinner.cal;
            const totalP = d.breakfast.protein + d.lunch.protein + d.dinner.protein;
            const totalC = d.breakfast.carb + d.lunch.carb + d.dinner.carb;
            return `
            <div class="section-card day-card" data-day="${day}" style="cursor:pointer;border: ${isToday ? `2px solid ${accentColor}` : '1px solid #e2e8f0'}; ${isToday ? `box-shadow: 0 4px 15px ${accentBg};` : ''};transition:all 0.3s;" onmouseover="this.style.transform='translateY(-5px)';this.style.boxShadow='0 8px 20px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='${isToday ? `0 4px 15px ${accentBg}` : ''}'">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem">
                    <h3 style="font-size:1.1rem;font-weight:700;color:var(--text-dark)">${dayIcons[day] || '📅'} ${day}</h3>
                    ${isToday ? `<span style="background:${accentColor};color:white;font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:20px">TODAY</span>` : ''}
                </div>
                <div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap">
                    <span style="font-size:0.73rem;font-weight:700;color:#64748b;background:#f1f5f9;padding:3px 10px;border-radius:20px">🔥 ${totalCal} kcal</span>
                    <span style="font-size:0.73rem;font-weight:700;color:#64748b;background:#f1f5f9;padding:3px 10px;border-radius:20px">💪 ${totalP}g protein</span>
                    <span style="font-size:0.73rem;font-weight:700;color:#64748b;background:#f1f5f9;padding:3px 10px;border-radius:20px">🌾 ${totalC}g carbs</span>
                </div>
                <div style="text-align:center;padding:0.5rem;background:#f8fafc;border-radius:8px;">
                    <span style="font-size:0.85rem;color:var(--primary-color);font-weight:600;">👉 Click to view meals</span>
                </div>
            </div>`;
        }).join('');

        // Add click handlers to day cards
        document.querySelectorAll('.day-card').forEach(card => {
            card.addEventListener('click', function() {
                const day = this.dataset.day;
                showDayMeals(day, type);
            });
        });
    };

    // Show detailed meals for a specific day
    const showDayMeals = (day, type) => {
        const grid = document.getElementById('meal-plan-grid');
        if (!grid) return;
        const meals = mealData[type];
        const d = meals[day];
        const accentColor = type === 'veg' ? '#16a34a' : '#dc2626';
        const totalCal = d.breakfast.cal + d.lunch.cal + d.dinner.cal;
        const totalP = d.breakfast.protein + d.lunch.protein + d.dinner.protein;
        const totalC = d.breakfast.carb + d.lunch.carb + d.dinner.carb;

        grid.innerHTML = `
            <div class="section-card" style="grid-column:1/-1;">
                <button onclick="renderMealGrid('${type}')" style="padding:8px 16px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;font-weight:600;color:var(--text-dark);margin-bottom:1rem;transition:all 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">← Back to Week View</button>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:1rem;">
                    <div>
                        <h2 style="font-size:1.5rem;font-weight:800;color:var(--text-dark);margin-bottom:0.5rem;">${dayIcons[day] || '📅'} ${day}'s Meal Plan</h2>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            <span style="font-size:0.85rem;font-weight:700;color:#64748b;background:#f1f5f9;padding:5px 12px;border-radius:20px">🔥 ${totalCal} kcal</span>
                            <span style="font-size:0.85rem;font-weight:700;color:#64748b;background:#f1f5f9;padding:5px 12px;border-radius:20px">💪 ${totalP}g protein</span>
                            <span style="font-size:0.85rem;font-weight:700;color:#64748b;background:#f1f5f9;padding:5px 12px;border-radius:20px">🌾 ${totalC}g carbs</span>
                        </div>
                    </div>
                </div>
                <div style="display:grid;gap:1.5rem;margin-top:1.5rem;">
                    <div style="padding:1.5rem;border-radius:12px;background:#fefce8;border:2px solid #fef08a;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem;">
                            <span style="font-size:2rem">${mealIcons.breakfast}</span>
                            <div>
                                <strong style="font-size:1rem;color:#92400e;text-transform:uppercase;letter-spacing:0.5px">Breakfast</strong>
                                <p style="margin:5px 0 0;font-size:1.1rem;color:var(--text-dark);font-weight:600;">${d.breakfast.name}</p>
                            </div>
                        </div>
                        ${nutriBadge(d.breakfast.cal, d.breakfast.protein, d.breakfast.carb)}
                    </div>
                    <div style="padding:1.5rem;border-radius:12px;background:#f0fdf4;border:2px solid #bbf7d0;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem;">
                            <span style="font-size:2rem">${mealIcons.lunch}</span>
                            <div>
                                <strong style="font-size:1rem;color:#166534;text-transform:uppercase;letter-spacing:0.5px">Lunch</strong>
                                <p style="margin:5px 0 0;font-size:1.1rem;color:var(--text-dark);font-weight:600;">${d.lunch.name}</p>
                            </div>
                        </div>
                        ${nutriBadge(d.lunch.cal, d.lunch.protein, d.lunch.carb)}
                    </div>
                    <div style="padding:1.5rem;border-radius:12px;background:#eff6ff;border:2px solid #bfdbfe;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem;">
                            <span style="font-size:2rem">${mealIcons.dinner}</span>
                            <div>
                                <strong style="font-size:1rem;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px">Dinner</strong>
                                <p style="margin:5px 0 0;font-size:1.1rem;color:var(--text-dark);font-weight:600;">${d.dinner.name}</p>
                            </div>
                        </div>
                        ${nutriBadge(d.dinner.cal, d.dinner.protein, d.dinner.carb)}
                    </div>
                </div>
            </div>`;
    };

    // Toggle button styling helper
    const updateToggleUI = (type) => {
        const btnVeg = document.getElementById('btn-veg');
        const btnNonveg = document.getElementById('btn-nonveg');
        if (!btnVeg || !btnNonveg) return;
        if (type === 'veg') {
            btnVeg.style.background = 'linear-gradient(135deg,#16a34a,#22c55e)';
            btnVeg.style.color = 'white';
            btnVeg.style.boxShadow = '0 2px 8px rgba(34,197,94,0.35)';
            btnNonveg.style.background = 'transparent';
            btnNonveg.style.color = '#64748b';
            btnNonveg.style.boxShadow = 'none';
        } else {
            btnNonveg.style.background = 'linear-gradient(135deg,#dc2626,#ef4444)';
            btnNonveg.style.color = 'white';
            btnNonveg.style.boxShadow = '0 2px 8px rgba(220,38,38,0.35)';
            btnVeg.style.background = 'transparent';
            btnVeg.style.color = '#64748b';
            btnVeg.style.boxShadow = 'none';
        }
    };

    // Exposed to global scope for onclick handlers
    window.renderMealGrid = renderMealGrid;
    
    window.switchDietType = (type) => {
        currentDietType = type;
        updateToggleUI(type);
        renderMealGrid(type);
        displayTodaysMeals();
        showToast(type === 'veg' ? '🌿 Switched to Vegetarian plan' : '🍗 Switched to Non-Veg plan', 'success');
    };

    window.generateMealPlan = () => {
        const src = mealData[currentDietType];
        const allBreakfasts = Object.values(src).map(d => d.breakfast);
        const allLunches = Object.values(src).map(d => d.lunch);
        const allDinners = Object.values(src).map(d => d.dinner);
        const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
        const sb = shuffle(allBreakfasts), sl = shuffle(allLunches), sd = shuffle(allDinners);
        const days = Object.keys(src);
        days.forEach((day, i) => { src[day] = { breakfast: sb[i], lunch: sl[i], dinner: sd[i] }; });
        renderMealGrid(currentDietType);
        displayTodaysMeals();
        showToast('✨ New meal plan generated!', 'success');
    };

    // Also try to load from API (overrides local data if available)
    const loadDietPlan = async () => {
        try {
            const res = await fetch('/api/v1/diet-plans/', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) { renderMealGrid(currentDietType); return; }
            const data = await res.json();
            const plans = data.results || data;
            if (plans.length > 0 && plans[0].daily_diets?.length > 0) {
                // Merge API data into the current diet type data
                plans[0].daily_diets.forEach(d => {
                    if (mealData[currentDietType][d.day]) {
                        mealData[currentDietType][d.day] = { breakfast: d.breakfast || '-', lunch: d.lunch || '-', dinner: d.dinner || '-' };
                    }
                });
            }
            renderMealGrid(currentDietType);
        } catch (e) { console.error(e); renderMealGrid(currentDietType); }
    };

    // Display today's meals on dashboard
    const displayTodaysMeals = () => {
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayMeals = mealData[currentDietType][todayName];
        const container = document.getElementById('daily-diet-summary');
        
        if (!container || !todayMeals) return;
        
        const mealIcons = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️' };
        const accentColor = currentDietType === 'veg' ? '#16a34a' : '#dc2626';
        
        container.innerHTML = `
            <div style="padding: 1rem; background: #fefce8; border-radius: 10px; border-left: 4px solid #fbbf24;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 1.3rem;">${mealIcons.breakfast}</span>
                    <strong style="font-size: 0.85rem; color: #92400e; text-transform: uppercase;">Breakfast</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: #1e293b; font-weight: 500;">${todayMeals.breakfast.name}</p>
                <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                    <span style="font-size: 0.7rem; font-weight: 600; background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 12px;">🔥 ${todayMeals.breakfast.cal} kcal</span>
                    <span style="font-size: 0.7rem; font-weight: 600; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 12px;">💪 ${todayMeals.breakfast.protein}g</span>
                </div>
            </div>
            
            <div style="padding: 1rem; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #22c55e;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 1.3rem;">${mealIcons.lunch}</span>
                    <strong style="font-size: 0.85rem; color: #166534; text-transform: uppercase;">Lunch</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: #1e293b; font-weight: 500;">${todayMeals.lunch.name}</p>
                <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                    <span style="font-size: 0.7rem; font-weight: 600; background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 12px;">🔥 ${todayMeals.lunch.cal} kcal</span>
                    <span style="font-size: 0.7rem; font-weight: 600; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 12px;">💪 ${todayMeals.lunch.protein}g</span>
                </div>
            </div>
            
            <div style="padding: 1rem; background: #eff6ff; border-radius: 10px; border-left: 4px solid #3b82f6;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 1.3rem;">${mealIcons.dinner}</span>
                    <strong style="font-size: 0.85rem; color: #1e40af; text-transform: uppercase;">Dinner</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: #1e293b; font-weight: 500;">${todayMeals.dinner.name}</p>
                <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                    <span style="font-size: 0.7rem; font-weight: 600; background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 12px;">🔥 ${todayMeals.dinner.cal} kcal</span>
                    <span style="font-size: 0.7rem; font-weight: 600; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 12px;">💪 ${todayMeals.dinner.protein}g</span>
                </div>
            </div>
            
            <div style="text-align: center; padding: 0.75rem; background: linear-gradient(135deg, ${accentColor}, ${accentColor}dd); border-radius: 10px; color: white;">
                <strong style="font-size: 0.85rem;">Total: ${todayMeals.breakfast.cal + todayMeals.lunch.cal + todayMeals.dinner.cal} kcal | ${todayMeals.breakfast.protein + todayMeals.lunch.protein + todayMeals.dinner.protein}g protein</strong>
            </div>
        `;
    };

    // ===== Local Storage Helpers =====
    const getLocalPlans = () => JSON.parse(localStorage.getItem('local_workout_plans') || '[]');
    const saveLocalPlans = (plans) => localStorage.setItem('local_workout_plans', JSON.stringify(plans));
    const getLocalHistory = () => JSON.parse(localStorage.getItem('local_workout_history') || '[]');
    const saveLocalHistory = (history) => localStorage.setItem('local_workout_history', JSON.stringify(history));

    const addLocalPlan = (plan) => {
        const plans = getLocalPlans();
        plan.id = plan.id || 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        plans.push(plan);
        saveLocalPlans(plans);
        return plan;
    };

    const updateLocalPlan = (id, updates) => {
        const plans = getLocalPlans();
        const idx = plans.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) { Object.assign(plans[idx], updates); saveLocalPlans(plans); return true; }
        return false;
    };

    const deleteLocalPlan = (id) => {
        const plans = getLocalPlans().filter(p => String(p.id) !== String(id));
        saveLocalPlans(plans);
    };

    const addLocalHistory = (entry) => {
        const history = getLocalHistory();
        entry.id = entry.id || 'hist_' + Date.now();
        history.unshift(entry);
        saveLocalHistory(history);
        return entry;
    };

    const deleteLocalHistory = (id) => {
        const history = getLocalHistory().filter(h => String(h.id) !== String(id));
        saveLocalHistory(history);
    };

    // ===== Workouts CRUD (API with localStorage fallback) =====
    const renderPlans = (plans) => {
        const typeIcons = { yoga: '🧘', zumba: '💃', hiit: '⚡', strength: '💪', cardio: '🏃', pilates: '🤸' };

        const todaysList = document.getElementById('todays-workout-list');
        if (todaysList) todaysList.innerHTML = plans.slice(0, 3).map(p => `
            <div class="workout-item">
                <div class="workout-icon">${typeIcons[p.type] || '🏃'}</div>
                <div class="workout-details"><h4 class="workout-title">${p.name}</h4>
                <div class="workout-meta"><span>${p.duration_minutes} mins</span> • <span>${p.difficulty}</span></div></div>
                <button class="workout-action" data-plan-id="${p.id}">Start</button>
            </div>`).join('') || '<p style="color:#64748b;padding:1rem">No workouts assigned yet.</p>';

        const grid = document.getElementById('workout-library-grid');
        if (grid) grid.innerHTML = plans.map(p => `
            <div class="stat-card" style="display:block;text-align:left;" data-plan-id="${p.id}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                    <span style="background:#e0f2fe;color:#0284c7;padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:600">${p.difficulty}</span>
                    <div class="stat-icon" style="font-size:1.5rem;width:40px;height:40px">${typeIcons[p.type] || '🏋️'}</div>
                </div>
                <h3 style="font-size:1.1rem;margin-bottom:0.4rem">${p.name}</h3>
                <p style="color:#64748b;font-size:0.88rem;margin-bottom:1rem">${p.description || 'Custom workout'}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:1rem">
                    <span style="font-size:0.85rem;color:#1e293b"><strong>${p.duration_minutes}</strong> min • ${p.estimated_calories} kcal</span>
                    <button class="workout-action" data-plan-id="${p.id}">Start</button>
                </div>
                <div class="workout-card-actions">
                    <button class="btn-edit" data-id="${p.id}" data-name="${encodeURIComponent(p.name)}" data-duration="${p.duration_minutes}" data-calories="${p.estimated_calories}" data-difficulty="${p.difficulty}" data-desc="${encodeURIComponent(p.description || '')}">✏️ Edit</button>
                    <button class="btn-delete" data-id="${p.id}">🗑️ Delete</button>
                </div>
            </div>`).join('') || '<p style="padding:1rem;color:#64748b">No workout plans yet. Click + Custom Workout to add one!</p>';
    };

    const renderHistory = (history) => {
        const typeIcons = { yoga: '🧘', zumba: '💃', hiit: '⚡', strength: '💪', cardio: '🏃', pilates: '🤸' };
        const tbody = document.getElementById('workout-history-list');
        if (!tbody) return;

        console.log('📊 Rendering workout history:', history);

        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No workout history yet. Start a workout to see it here!</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(h => {
            // Parse date — backend returns "Jan 01, 2025 12:00 PM" format
            let dateStr = '—', timeStr = '';
            if (h.completed_at) {
                try {
                    const d = new Date(h.completed_at);
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    } else {
                        // Fallback: use the string as-is
                        dateStr = h.completed_at.split(' ').slice(0, 3).join(' ');
                        timeStr = h.completed_at.split(' ').slice(3).join(' ');
                    }
                } catch (e) {
                    dateStr = h.completed_at;
                }
            }

            let icon = '🏋️';
            const n = (h.workout_name || '').toLowerCase();
            if (n.includes('yoga')) icon = typeIcons.yoga;
            else if (n.includes('zumba')) icon = typeIcons.zumba;
            else if (n.includes('hiit')) icon = typeIcons.hiit;
            else if (n.includes('strength') || n.includes('weight')) icon = typeIcons.strength;
            else if (n.includes('cardio') || n.includes('run')) icon = typeIcons.cardio;
            else if (n.includes('pilates')) icon = typeIcons.pilates;

            // duration: prefer duration_seconds, fall back to duration_minutes * 60
            const secs = h.duration_seconds != null ? Number(h.duration_seconds)
                       : h.duration_minutes  != null ? Number(h.duration_minutes) * 60 : 0;

            const isCompleted = h.completed === true || h.completed === 1 || h.completed === '1';
            const statusColor = isCompleted ? '#10b981' : '#f59e0b';
            const statusBg    = isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)';
            const statusText  = isCompleted ? '✅ Completed' : '⚠️ Incomplete';

            return `<tr style="border-bottom:1px solid #e2e8f0;transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                <td style="padding:0.9rem 1rem;">
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <span style="font-size:1.4rem;">${icon}</span>
                        <span style="font-weight:600;color:#1e293b;">${h.workout_name || 'Workout Session'}</span>
                    </div>
                </td>
                <td style="padding:0.9rem 1rem;color:#64748b;font-size:0.9rem;">${dateStr}${timeStr ? '<br><span style="font-size:0.8rem;">' + timeStr + '</span>' : ''}</td>
                <td style="padding:0.9rem 1rem;font-weight:600;color:#1e293b;">${fmtDuration(secs)}</td>
                <td style="padding:0.9rem 1rem;font-weight:700;color:#667eea;">🔥 ${h.calories_burned || 0} kcal</td>
                <td style="padding:0.9rem 1rem;"><span style="padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;background:${statusBg};color:${statusColor};">${statusText}</span></td>
                <td style="padding:0.9rem 1rem;">
                    <button class="btn-delete-history" data-id="${h.id}" title="Remove" style="background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.45;transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.45'">🗑️</button>
                </td>
            </tr>`;
        }).join('');
        
        console.log(`✅ Rendered ${history.length} workout history entries`);
    };

    const loadWorkouts = async () => {
        let plans = [];
        let history = [];
        let usedAPI = false;

        // Try API first
        try {
            const planRes = await fetch('/api/user/workout-plans', { credentials: 'same-origin' });
            if (planRes.ok) {
                plans = await planRes.json();
                usedAPI = true;
            }
        } catch (e) { console.log('API unavailable, using local storage for plans.'); }

        // Fallback to localStorage
        if (!usedAPI) {
            plans = getLocalPlans();
        }
        renderPlans(plans);

        // Load History
        let usedAPIHist = false;
        try {
            const histRes = await fetch('/api/user/workout-history', { credentials: 'same-origin' });
            if (histRes.ok) {
                history = await histRes.json();
                usedAPIHist = true;
            }
        } catch (e) { console.log('API unavailable, using local storage for history.'); }

        if (!usedAPIHist) {
            history = getLocalHistory();
        }
        renderHistory(history);
        await updateDashboardStats(history, document.getElementById('p_weight')?.value || null);
    };

    // Edit workout
    const editModal = document.getElementById('edit-workout-modal');
    const editForm = document.getElementById('edit-workout-form');
    document.querySelectorAll('.close-edit-modal').forEach(btn => btn.addEventListener('click', () => { editModal.style.display = 'none'; }));

    document.addEventListener('click', e => {
        if (e.target.classList.contains('btn-edit')) {
            const btn = e.target;
            document.getElementById('edit_plan_id').value = btn.dataset.id;
            document.getElementById('edit_name').value = decodeURIComponent(btn.dataset.name);
            document.getElementById('edit_duration').value = btn.dataset.duration;
            document.getElementById('edit_calories').value = btn.dataset.calories;
            document.getElementById('edit_difficulty').value = btn.dataset.difficulty;
            document.getElementById('edit_description').value = decodeURIComponent(btn.dataset.desc);
            editModal.style.display = 'flex';
        }

        if (e.target.classList.contains('btn-delete')) {
            const id = e.target.dataset.id;
            if (!confirm('Delete this workout plan? This action cannot be undone.')) return;

            // Try API first, fallback to local
            fetch(`/api/user/workout-plans/${id}`, {
                method: 'DELETE', credentials: 'same-origin'
            }).then(res => {
                if (res.ok || res.status === 204) { showToast('Workout deleted.', 'warning'); loadWorkouts(); }
                else showToast('Failed to delete workout.', 'error');
            }).catch(() => {
                // Fallback: delete from localStorage
                deleteLocalPlan(id);
                showToast('Workout deleted.', 'warning');
                loadWorkouts();
            });
        }

        // Delete from workout history
        if (e.target.classList.contains('btn-delete-history')) {
            const id = e.target.dataset.id;
            if (!confirm('Remove this entry from workout history?')) return;
            
            fetch(`/api/user/workout-history/${id}`, {
                method: 'DELETE', credentials: 'same-origin'
            }).then(res => {
                if (res.ok || res.status === 204) { showToast('History entry removed.', 'warning'); loadWorkouts(); }
                else showToast('Failed to delete history entry.', 'error');
            }).catch(() => {
                deleteLocalHistory(id);
                showToast('History entry removed.', 'warning');
                loadWorkouts();
            });
        }
    });

    editForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('edit_plan_id').value;
        const payload = {
            name: document.getElementById('edit_name').value,
            duration_minutes: document.getElementById('edit_duration').value,
            estimated_calories: document.getElementById('edit_calories').value,
            difficulty: document.getElementById('edit_difficulty').value,
            description: document.getElementById('edit_description').value
        };
        try {
            const res = await fetch(`/api/user/workout-plans/${id}`, {
                method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) { editModal.style.display = 'none'; loadWorkouts(); showToast('Workout updated! 🎉', 'success'); }
            else { const err = await res.json(); showToast('Error: ' + (err.error || JSON.stringify(err)), 'error'); }
        } catch (e) {
            // Fallback: update in localStorage
            updateLocalPlan(id, payload);
            editModal.style.display = 'none';
            loadWorkouts();
            showToast('Workout updated! 🎉', 'success');
        }
    });

    window.addEventListener('click', e => { if (e.target === editModal) editModal.style.display = 'none'; });

    const loadAppointments = async () => {
        try {
            const res = await fetch('/api/v1/appointments/', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return;
            const data = await res.json();
            const appts = data.results || data;
            const list = document.getElementById('upcoming-classes-list');
            if (list) list.innerHTML = appts.map(appt => {
                const d = new Date(appt.date_time);
                const t = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).split(' ');
                return `<div class="class-item">
                    <div class="class-time"><span class="time">${t[0]}</span><span class="ampm">${t[1] || ''}</span></div>
                    <div class="class-info"><h4>${appt.session_type_name || 'Training'}</h4>
                    <span class="class-trainer">${d.toLocaleDateString()} with ${appt.trainer_name || 'Trainer'}</span></div>
                </div>`;
            }).join('') || '<p style="padding:1rem;color:#64748b">No upcoming classes.</p>';
        } catch (e) { console.error(e); }
    };

    // ===== Custom Workout Modal =====
    const customWorkoutModal = document.getElementById('custom-workout-modal');
    const step1 = document.getElementById('custom-workout-step1');
    const step2 = document.getElementById('custom-workout-step2');
    const modalTitle = document.getElementById('custom-workout-title');
    const cwForm = document.getElementById('custom-workout-form');

    const resetModal = () => {
        if (step1 && step2) { step1.style.display = 'grid'; step2.style.display = 'none'; }
        if (modalTitle) modalTitle.textContent = 'Choose Workout Type';
        cwForm?.reset();
    };

    document.getElementById('custom-workout-btn')?.addEventListener('click', () => { resetModal(); customWorkoutModal.style.display = 'flex'; });
    document.querySelector('.close-modal')?.addEventListener('click', () => { customWorkoutModal.style.display = 'none'; });
    document.getElementById('cw_back_btn')?.addEventListener('click', resetModal);
    window.addEventListener('click', e => { if (e.target === customWorkoutModal) customWorkoutModal.style.display = 'none'; });

    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-workout');
            const name = card.querySelector('.option-name').textContent;
            if (step1 && step2) { step1.style.display = 'none'; step2.style.display = 'block'; }
            if (modalTitle) modalTitle.textContent = `Setup: ${name}`;
            document.getElementById('cw_type').value = type;
            document.getElementById('cw_name').value = name;
            const defaults = { zumba: ['60', '450'], yoga: ['75', '200'], hiit: ['40', '400'], pilates: ['50', '250'] };
            const [dur, cal] = defaults[type] || ['45', '350'];
            document.getElementById('cw_duration').value = dur;
            document.getElementById('cw_calories').value = cal;
            document.getElementById('cw_difficulty').value = 'Intermediate';
        });
    });

    cwForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('cw_name').value,
            type: document.getElementById('cw_type').value,
            duration_minutes: document.getElementById('cw_duration').value,
            estimated_calories: document.getElementById('cw_calories').value,
            difficulty: document.getElementById('cw_difficulty').value,
            description: document.getElementById('cw_description').value || `Custom ${document.getElementById('cw_name').value} workout.`
        };
        
        try {
            const res = await fetch('/api/user/workout-plans', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const plan = await res.json();
                customWorkoutModal.style.display = 'none';
                resetModal();
                loadWorkouts();
                showToast(`🎉 "${plan.name}" added to your library! Start it to log to history. (Expires in 24 hours)`, 'success', 6000);
            } else {
                const err = await res.json();
                showToast('Error: ' + (err.error || JSON.stringify(err)), 'error');
            }
        } catch (e) { showToast('Network error.', 'error'); console.error(e); }
    });

    // ===== Subscription Gate =====
    const GATED_SECTIONS = ['dashboard', 'workouts', 'diet', 'progress'];

    function showSubscriptionGate() {
        GATED_SECTIONS.forEach(id => {
            const sec = document.getElementById(id);
            if (!sec || sec.querySelector('.sub-gate-overlay')) return;
            const overlay = document.createElement('div');
            overlay.className = 'sub-gate-overlay';
            overlay.innerHTML = `
                <div style="text-align:center;padding:2rem;">
                    <div style="font-size:3rem;margin-bottom:1rem;">&#128274;</div>
                    <h2 style="font-size:1.4rem;font-weight:800;color:#1e293b;margin-bottom:0.5rem;">Subscription Required</h2>
                    <p style="color:#64748b;font-size:0.95rem;margin-bottom:1.5rem;max-width:320px;">
                        You need an active plan to access this feature. Choose a plan to unlock the full dashboard.
                    </p>
                    <button class="workout-action" onclick="document.querySelector('a[href=\'#subscription\']').click()">
                        &#128179; Choose a Plan
                    </button>
                </div>`;
            overlay.style.cssText = 'position:absolute;inset:0;background:rgba(248,250,252,0.93);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:50;border-radius:20px;';
            sec.style.position = 'relative';
            sec.appendChild(overlay);
        });
        navLinks.forEach(link => {
            const id = link.getAttribute('href').substring(1);
            if (GATED_SECTIONS.includes(id)) {
                link.style.opacity = '0.4';
                link.style.pointerEvents = 'none';
                link.title = 'Subscribe to unlock';
            }
        });
    }

    function removeSubscriptionGate() {
        GATED_SECTIONS.forEach(id => {
            const sec = document.getElementById(id);
            if (!sec) return;
            const ov = sec.querySelector('.sub-gate-overlay');
            if (ov) ov.remove();
        });
        navLinks.forEach(link => {
            link.style.opacity = '';
            link.style.pointerEvents = '';
            link.title = '';
        });
    }

    // ===== Subscription =====
    const loadSubscription = async () => {
        try {
            const res  = await fetch('/api/user/subscription', { credentials: 'same-origin' });
            const data = await res.json();
            if (!res.ok) return;

            const active  = data.active;
            const pending = data.history.find(s => s.status === 'Pending');
            const locked  = active || pending;

            // Apply or remove gate based on active plan only
            if (active) {
                removeSubscriptionGate();
            } else {
                showSubscriptionGate();
            }

            // Update banner
            if (active) {
                document.getElementById('current-plan-name').textContent   = active.plan_name;
                document.getElementById('current-plan-price').textContent  = '\u20B9' + active.amount;
                document.getElementById('current-plan-expiry').textContent = 'Active until ' + active.expiry_date;
                document.getElementById('current-plan-banner').style.background =
                    active.plan_name === 'Premium'  ? 'linear-gradient(135deg,#f59e0b,#d97706)' :
                    active.plan_name === 'Standard' ? 'linear-gradient(135deg,#667eea,#764ba2)' :
                    'linear-gradient(135deg,#10b981,#059669)';
            } else if (pending) {
                document.getElementById('current-plan-name').textContent   = pending.plan_name + ' (Pending)';
                document.getElementById('current-plan-price').textContent  = '\u20B9' + pending.amount;
                document.getElementById('current-plan-expiry').textContent = 'Awaiting admin approval';
                document.getElementById('current-plan-banner').style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
            }

            // Lock / unlock plan buttons
            document.querySelectorAll('.sub-plan-btn').forEach(btn => {
                const card = btn.closest('.sub-plan-card');
                card.classList.remove('sub-active');
                if (active && btn.dataset.plan === active.plan_name) {
                    card.classList.add('sub-active');
                    btn.textContent = '\u2705 Current Plan';
                    btn.disabled = true;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'default';
                } else if (locked) {
                    btn.textContent = '\uD83D\uDD12 Plan Active';
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                } else {
                    btn.textContent = 'Choose ' + btn.dataset.plan;
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                }
            });

            // History table
            const tbody = document.getElementById('subscription-history-tbody');
            if (data.history.length) {
                tbody.innerHTML = data.history.map(s => {
                    const color = s.status === 'Active' ? '#10b981' : s.status === 'Pending' ? '#f59e0b' : '#64748b';
                    const bg    = s.status === 'Active' ? 'rgba(16,185,129,0.1)' : s.status === 'Pending' ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)';
                    return '<tr style="border-bottom:1px solid #e2e8f0;">'
                        + '<td style="padding:1rem;font-weight:600;">' + s.plan_name + '</td>'
                        + '<td style="padding:1rem;">&#8377;' + s.amount + '/yr</td>'
                        + '<td style="padding:1rem;">' + s.start_date + '</td>'
                        + '<td style="padding:1rem;">' + s.expiry_date + '</td>'
                        + '<td style="padding:1rem;"><span style="padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;background:' + bg + ';color:' + color + '">' + s.status + '</span></td>'
                        + '</tr>';
                }).join('');
            }
        } catch (e) { console.warn('Subscription load error', e); }
    };

    document.body.addEventListener('click', async function (e) {
        const btn = e.target.closest('.sub-plan-btn');
        if (!btn || btn.disabled) return;
        const plan  = btn.dataset.plan;
        const price = btn.dataset.price;
        if (!plan) return;
        if (!confirm(`Subscribe to the ${plan} plan for \u20B9${price}/year?`)) return;
        try {
            const res  = await fetch('/api/user/subscription', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, price })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message, 'success');
                loadSubscription();
            } else {
                showToast(data.error || 'Failed to subscribe.', 'error');
            }
        } catch (err) { showToast('Network error: ' + err.message, 'error'); }
    });

    // ===== Profile: Load from DB =====
    const loadProfile = async () => {
        try {
            const res  = await fetch('/api/user/profile', { credentials: 'same-origin' });
            const data = await parseJsonResponse(res);
            if (!res.ok || data.error) {
                showToast(data.error || 'Unable to load profile.', 'error');
                return;
            }

            // Header
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
            const h = document.querySelector('.welcome-text h1');
            if (h) h.textContent = `Welcome back, ${data.first_name || 'User'}!`;
            const nameEl = document.querySelector('.user-name');
            if (nameEl) nameEl.textContent = fullName || 'User';
            const avatarEl = document.querySelector('.avatar');
            if (avatarEl) avatarEl.textContent = (data.first_name || 'U').charAt(0).toUpperCase();
            
            // Mobile navbar avatar
            const mobileAvatarEl = document.querySelector('.mobile-avatar');
            if (mobileAvatarEl) mobileAvatarEl.textContent = (data.first_name || 'U').charAt(0).toUpperCase();

            // Personal Info form
            const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            set('p_fname',    data.first_name);
            set('p_lname',    data.last_name);
            set('p_email',    data.email);
            set('p_phone',    data.phone);
            set('p_age',      data.age);
            set('p_gender',   data.gender);

            // Physical Stats form
            set('p_height',         data.height);
            set('p_weight',         data.weight);
            set('p_fitness_goal',   data.fitness_goal);
            set('p_activity_level', data.activity_level);
        } catch (e) { console.warn('Profile load error', e); }
    };

    // ===== Profile: Save to DB =====
    document.querySelector('.profile-save-btn')?.addEventListener('click', async () => {
        const get = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
        const payload = {
            first_name:     get('p_fname'),
            last_name:      get('p_lname'),
            phone:          get('p_phone'),
            age:            get('p_age')            || null,
            gender:         get('p_gender'),
            height:         get('p_height')         || null,
            weight:         get('p_weight')         || null,
            fitness_goal:   get('p_fitness_goal'),
            activity_level: get('p_activity_level'),
        };
        try {
            const res  = await fetch('/api/user/profile', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await parseJsonResponse(res);
            if (!res.ok || data.error) {
                showToast(data.error || 'Failed to save.', 'error');
                return;
            }
            showToast('Profile saved successfully!', 'success');
            loadProfile();
        } catch (e) { showToast('Network error.', 'error'); }
    });

    // ===== Dashboard Init =====
    const initializeDashboard = async () => {
        await loadProfile();
        loadSubscription();
        renderMealGrid(currentDietType);
        displayTodaysMeals();
        loadWorkouts();
        loadMeasurements();
        loadStreak();
    };

    initializeDashboard();

    // ===== Account Delete =====
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone!')) {
                try {
                    const res = await fetch('/api/v1/members/me/', {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok || res.status === 204) {
                        alert('Account successfully deleted.');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('user_role');
                        window.location.href = '../login/user_login.html';
                    } else {
                        const err = await res.json();
                        showToast('Failed to delete account.', 'error');
                        console.error('Delete error:', err);
                    }
                } catch (e) {
                    showToast('Network error while deleting account.', 'error');
                    console.error(e);
                }
            }
        });
    }
});
