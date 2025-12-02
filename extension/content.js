/**
 * ScholarStream Copilot - Content Script
 * Auto-fills scholarship and hackathon application forms
 */

class ScholarStreamCopilot {
  constructor() {
    this.userProfile = null;
    this.currentOpportunity = null;
    this.init();
  }

  async init() {
    // Load user profile from extension storage
    this.userProfile = await this.getUserProfile();
    
    if (!this.userProfile) {
      console.log('[ScholarStream] No user profile found. Please log in to ScholarStream.');
      return;
    }

    // Detect if we're on an application page
    if (this.isApplicationPage()) {
      this.injectCopilotUI();
      this.detectFields();
    }
  }

  isApplicationPage() {
    const url = window.location.href.toLowerCase();
    const keywords = ['apply', 'application', 'submit', 'register', 'signup', 'form'];
    
    // Check URL
    if (keywords.some(kw => url.includes(kw))) {
      return true;
    }
    
    // Check for form elements
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      const hasNameField = document.querySelector('input[name*="name"], input[id*="name"]');
      const hasEmailField = document.querySelector('input[type="email"]');
      const hasEssayField = document.querySelector('textarea');
      
      return hasNameField && (hasEmailField || hasEssayField);
    }
    
    return false;
  }

  injectCopilotUI() {
    // Create floating assistant button
    const copilotButton = document.createElement('div');
    copilotButton.id = 'scholarstream-copilot-btn';
    copilotButton.innerHTML = `
      <div class="copilot-fab">
        <div class="copilot-icon">S</div>
        <span>ScholarStream</span>
      </div>
    `;
    
    copilotButton.addEventListener('click', () => this.showCopilotPanel());
    document.body.appendChild(copilotButton);
  }

  showCopilotPanel() {
    if (document.getElementById('scholarstream-copilot-panel')) {
      document.getElementById('scholarstream-copilot-panel').remove();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'scholarstream-copilot-panel';
    panel.innerHTML = `
      <div class="copilot-panel">
        <div class="copilot-header">
          <h3>🎓 ScholarStream Copilot</h3>
          <button class="close-btn" id="close-panel">×</button>
        </div>
        <div class="copilot-body">
          <div class="profile-summary">
            <div class="profile-avatar">${this.userProfile?.name?.[0] || 'U'}</div>
            <div>
              <p class="profile-name">${this.userProfile?.name || 'User'}</p>
              <p class="profile-school">${this.userProfile?.school || 'Student'}</p>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn-primary" id="auto-fill-btn">
              ⚡ Auto-Fill Form
            </button>
            <button class="btn-secondary" id="essay-help-btn">
              ✍️ Essay Assistant
            </button>
          </div>
          
          <div class="field-mapping">
            <h4>Detected Fields</h4>
            <ul id="field-list"></ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Event listeners
    document.getElementById('auto-fill-btn')?.addEventListener('click', () => this.autoFillForm());
    document.getElementById('essay-help-btn')?.addEventListener('click', () => this.openEssayAssistant());
    document.getElementById('close-panel')?.addEventListener('click', () => panel.remove());
    
    this.displayDetectedFields();
  }

  detectFields() {
    this.fields = {
      name: this.findFields(['name', 'full name', 'fullname', 'applicant name']),
      email: this.findFields(['email', 'e-mail']),
      phone: this.findFields(['phone', 'telephone', 'mobile']),
      address: this.findFields(['address', 'street', 'city', 'state', 'zip']),
      school: this.findFields(['school', 'university', 'college', 'institution']),
      gpa: this.findFields(['gpa', 'grade point average']),
      major: this.findFields(['major', 'field of study', 'concentration']),
      essay: this.findFields(['essay', 'statement', 'describe', 'tell us', 'why']),
    };
  }

  findFields(keywords) {
    const foundFields = [];
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const label = this.getFieldLabel(input);
      const name = input.name || input.id || '';
      const placeholder = input.placeholder || '';
      const searchText = `${label} ${name} ${placeholder}`.toLowerCase();
      
      if (keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
        foundFields.push({
          element: input,
          type: input.type || input.tagName.toLowerCase(),
          label: label || name || placeholder,
          name: name
        });
      }
    });
    
    return foundFields;
  }

  getFieldLabel(element) {
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent.trim();
    }
    
    const parent = element.parentElement;
    const label = parent?.querySelector('label');
    if (label) return label.textContent.trim();
    
    return '';
  }

  displayDetectedFields() {
    const fieldList = document.getElementById('field-list');
    if (!fieldList) return;

    fieldList.innerHTML = '';
    let totalFields = 0;

    Object.entries(this.fields).forEach(([category, fields]) => {
      totalFields += fields.length;
      if (fields.length > 0) {
        const li = document.createElement('li');
        li.textContent = `${category}: ${fields.length} field(s)`;
        fieldList.appendChild(li);
      }
    });

    if (totalFields === 0) {
      fieldList.innerHTML = '<li>No fields detected</li>';
    }
  }

  async autoFillForm() {
    if (!this.userProfile) {
      this.showToast('Please log in to ScholarStream first', 'error');
      return;
    }

    let filledCount = 0;

    // Fill name fields
    this.fields.name.forEach(field => {
      field.element.value = this.userProfile.full_name || this.userProfile.name || '';
      this.triggerInput(field.element);
      filledCount++;
    });

    // Fill email
    this.fields.email.forEach(field => {
      field.element.value = this.userProfile.email || '';
      this.triggerInput(field.element);
      filledCount++;
    });

    // Fill phone
    this.fields.phone.forEach(field => {
      field.element.value = this.userProfile.phone || '';
      this.triggerInput(field.element);
      filledCount++;
    });

    // Fill school
    this.fields.school.forEach(field => {
      field.element.value = this.userProfile.school || '';
      this.triggerInput(field.element);
      filledCount++;
    });

    // Fill GPA
    this.fields.gpa.forEach(field => {
      field.element.value = this.userProfile.gpa || '';
      this.triggerInput(field.element);
      filledCount++;
    });

    // Fill major
    this.fields.major.forEach(field => {
      field.element.value = this.userProfile.major || '';
      this.triggerInput(field.element);
      filledCount++;
    });

    // Track this application
    await this.trackApplication();

    this.showToast(`✅ Auto-filled ${filledCount} fields successfully!`, 'success');
  }

  triggerInput(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  async openEssayAssistant() {
    const essayFields = this.fields.essay;
    
    if (essayFields.length === 0) {
      this.showToast('No essay fields detected on this page', 'error');
      return;
    }

    this.showToast('Essay assistant coming soon! 📝', 'info');
  }

  async trackApplication() {
    const opportunityData = {
      name: document.title,
      url: window.location.href,
      organization: this.extractOrganization(),
      detected_at: new Date().toISOString(),
      status: 'in_progress'
    };

    // Save to extension storage
    chrome.storage.local.get(['applications'], (result) => {
      const applications = result.applications || [];
      applications.push(opportunityData);
      chrome.storage.local.set({ applications });
    });

    // TODO: Sync to backend when API is ready
  }

  extractOrganization() {
    const domain = window.location.hostname;
    return domain.replace('www.', '').split('.')[0];
  }

  async getUserProfile() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['userProfile'], (result) => {
        resolve(result.userProfile);
      });
    });
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `scholarstream-toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ScholarStreamCopilot());
} else {
  new ScholarStreamCopilot();
}
