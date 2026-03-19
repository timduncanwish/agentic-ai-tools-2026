import {
  API,
  escapeHtml,
  formatCount,
  formatDate,
  requestJson,
  setGlobalStatus
} from './discovery-core.js';

function getField(form, name) {
  return form.elements.namedItem(name);
}

function getSafeHttpUrl(value) {
  const url = String(value || '').trim();
  return /^https?:\/\//.test(url) ? url : '#';
}

function renderAdminStats(stats) {
  const container = document.getElementById('adminStats');
  container.innerHTML = [
    ['Total tools', stats.totalTools],
    ['Featured tools', stats.featuredTools],
    ['Verified tools', stats.verifiedTools],
    ['Newsletter leads', stats.newsletterLeads],
    ['Pending submissions', stats.pendingSubmissions],
    ['Approved submissions', stats.approvedSubmissions]
  ]
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <strong>${formatCount(value)}</strong>
          <div class="meta-copy">${escapeHtml(label)}</div>
        </article>
      `
    )
    .join('');
}

function renderSubmissionQueue(submissions, onApprove, onReject) {
  const container = document.getElementById('submissionQueue');

  if (!submissions.length) {
    container.innerHTML = `
      <div class="shortlist-empty glass-card">
        <h3>No submissions yet</h3>
        <p class="empty-copy">New tool submissions will appear here for editorial triage.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = submissions
    .map(
      (submission) => `
        <article class="tool-card">
          <div class="tool-head">
            <div>
              <h3 class="tool-name">${escapeHtml(submission.name)}</h3>
              <div class="tool-subcategory">${escapeHtml(submission.category)} | ${escapeHtml(submission.pricingModel || 'pricing unknown')}</div>
            </div>
            <span class="meta-chip ${submission.status === 'approved' ? 'is-brand' : submission.status === 'rejected' ? 'is-accent' : ''}">
              ${escapeHtml(submission.status)}
            </span>
          </div>
          <p class="card-copy">${escapeHtml(submission.notes || 'No notes provided.')}</p>
          <div class="meta-row">
            <span class="meta-chip">${escapeHtml(submission.contactEmail)}</span>
            <span class="meta-chip">${escapeHtml(formatDate(submission.createdAt))}</span>
            ${
              submission.approvedToolSlug
                ? `<span class="meta-chip is-brand">Tool: ${escapeHtml(submission.approvedToolSlug)}</span>`
                : ''
            }
          </div>
          <div class="tool-actions">
            <a class="button" href="${escapeHtml(getSafeHttpUrl(submission.url))}" target="_blank" rel="noreferrer">Visit site</a>
            <button class="button-secondary js-admin-approve" data-id="${escapeHtml(submission.id)}" type="button">Approve</button>
            <button class="button-ghost js-admin-reject" data-id="${escapeHtml(submission.id)}" type="button">Reject</button>
          </div>
        </article>
      `
    )
    .join('');

  container.querySelectorAll('.js-admin-approve').forEach((button) => {
    button.addEventListener('click', () => onApprove(button.dataset.id));
  });

  container.querySelectorAll('.js-admin-reject').forEach((button) => {
    button.addEventListener('click', () => onReject(button.dataset.id));
  });
}

function renderToolCatalog(tools, onLoadTool) {
  const container = document.getElementById('toolCatalog');
  container.innerHTML = tools
    .map(
      (tool) => `
        <article class="tool-card">
          <div class="tool-head">
            <div>
              <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
              <div class="tool-subcategory">${escapeHtml(tool.categoryLabel)} | ${escapeHtml(tool.pricingLabel)}</div>
            </div>
            <span class="meta-chip rating-chip">Rating ${escapeHtml(Number(tool.rating || 0).toFixed(1))}</span>
          </div>
          <p class="card-copy">${escapeHtml(tool.description)}</p>
          <div class="meta-row">
            ${tool.featured ? '<span class="meta-chip is-accent">Featured</span>' : ''}
            ${tool.verified ? '<span class="meta-chip is-brand">Verified</span>' : ''}
            <span class="meta-chip">Updated ${escapeHtml(formatDate(tool.updatedAt))}</span>
          </div>
          <div class="tool-actions">
            <button class="button-ghost js-load-tool" data-slug="${escapeHtml(tool.slug)}" type="button">Load into editor</button>
            <a class="button" href="${escapeHtml(getSafeHttpUrl(tool.websiteUrl))}" target="_blank" rel="noreferrer">Visit site</a>
          </div>
        </article>
      `
    )
    .join('');

  container.querySelectorAll('.js-load-tool').forEach((button) => {
    button.addEventListener('click', () => onLoadTool(button.dataset.slug));
  });
}

function assignToolForm(form, tool) {
  getField(form, 'slug').value = tool.slug || '';
  getField(form, 'name').value = tool.name || '';
  getField(form, 'category').value = tool.category || '';
  getField(form, 'categoryLabel').value = tool.categoryLabel || '';
  getField(form, 'subcategory').value = tool.subcategory || '';
  getField(form, 'description').value = tool.description || '';
  getField(form, 'editorialNote').value = tool.editorialNote || '';
  getField(form, 'pricingModel').value = tool.pricingModel || '';
  getField(form, 'pricingLabel').value = tool.pricingLabel || '';
  getField(form, 'rating').value = tool.rating ?? 4.0;
  getField(form, 'trendingScore').value = tool.trendingScore ?? 50;
  getField(form, 'websiteUrl').value = tool.websiteUrl || '';
  getField(form, 'reviewUrl').value = tool.reviewUrl || '';
  getField(form, 'tags').value = (tool.tags || []).join(', ');
  getField(form, 'useCases').value = (tool.useCases || []).join(', ');
  getField(form, 'verified').checked = Boolean(tool.verified);
  getField(form, 'featured').checked = Boolean(tool.featured);
  getField(form, 'sponsored').checked = Boolean(tool.sponsored);
}

async function init() {
  const statsStatus = document.getElementById('adminStatus');
  const toolForm = document.getElementById('toolEditorForm');
  const approveForm = document.getElementById('approvalForm');
  const editorMode = document.getElementById('editorMode');

  let currentTools = [];
  let currentSubmissions = [];
  let activeToolSlug = '';

  async function refreshAdmin() {
    const data = await requestJson(API.adminOverview);
    currentTools = data.tools;
    currentSubmissions = data.submissions;
    renderAdminStats(data.stats);
    renderSubmissionQueue(
      data.submissions,
      async (submissionId) => {
        const submission = currentSubmissions.find((item) => item.id === submissionId);
        if (!submission) {
          return;
        }

        getField(approveForm, 'submissionId').value = submission.id;
        getField(approveForm, 'categoryLabel').value = submission.category;
        getField(approveForm, 'subcategory').value = 'Submitted tool';
        getField(approveForm, 'description').value = submission.notes || `${submission.name} submitted for review.`;
        getField(approveForm, 'editorialNote').value = `Approved from submission queue on ${new Date().toISOString().split('T')[0]}.`;
        getField(approveForm, 'pricingLabel').value = submission.pricingModel || 'Pricing not provided';
        getField(approveForm, 'tags').value = submission.category;
        getField(approveForm, 'useCases').value = submission.notes || submission.category;
        getField(approveForm, 'reviewUrl').value = '';
        getField(approveForm, 'featured').checked = false;
        statsStatus.textContent = `Loaded submission "${submission.name}" into approval form.`;
        statsStatus.classList.remove('error');
        approveForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      async (submissionId) => {
        await requestJson(`/api/admin/submissions/${encodeURIComponent(submissionId)}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: 'Rejected from local admin panel' })
        });
        statsStatus.textContent = 'Submission rejected.';
        statsStatus.classList.remove('error');
        await refreshAdmin();
      }
    );
    renderToolCatalog(data.tools, async (slug) => {
      const tool = currentTools.find((item) => item.slug === slug);
      if (!tool) {
        return;
      }

      activeToolSlug = slug;
      editorMode.textContent = `Editing ${tool.name}`;
      assignToolForm(toolForm, tool);
      statsStatus.textContent = `Loaded ${tool.name} into editor.`;
      statsStatus.classList.remove('error');
      toolForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  approveForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submissionId = getField(approveForm, 'submissionId').value;

    if (!submissionId) {
      statsStatus.textContent = 'Load a submission first.';
      statsStatus.classList.add('error');
      return;
    }

    try {
      await requestJson(`/api/admin/submissions/${encodeURIComponent(submissionId)}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryLabel: getField(approveForm, 'categoryLabel').value,
          subcategory: getField(approveForm, 'subcategory').value,
          description: getField(approveForm, 'description').value,
          editorialNote: getField(approveForm, 'editorialNote').value,
          pricingLabel: getField(approveForm, 'pricingLabel').value,
          tags: getField(approveForm, 'tags').value,
          useCases: getField(approveForm, 'useCases').value,
          reviewUrl: getField(approveForm, 'reviewUrl').value,
          featured: getField(approveForm, 'featured').checked
        })
      });

      approveForm.reset();
      statsStatus.textContent = 'Submission approved and added to catalog.';
      statsStatus.classList.remove('error');
      await refreshAdmin();
    } catch (error) {
      statsStatus.textContent = error.message;
      statsStatus.classList.add('error');
    }
  });

  toolForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      slug: getField(toolForm, 'slug').value,
      name: getField(toolForm, 'name').value,
      category: getField(toolForm, 'category').value,
      categoryLabel: getField(toolForm, 'categoryLabel').value,
      subcategory: getField(toolForm, 'subcategory').value,
      description: getField(toolForm, 'description').value,
      editorialNote: getField(toolForm, 'editorialNote').value,
      pricingModel: getField(toolForm, 'pricingModel').value,
      pricingLabel: getField(toolForm, 'pricingLabel').value,
      rating: getField(toolForm, 'rating').value,
      trendingScore: getField(toolForm, 'trendingScore').value,
      websiteUrl: getField(toolForm, 'websiteUrl').value,
      reviewUrl: getField(toolForm, 'reviewUrl').value,
      tags: getField(toolForm, 'tags').value,
      useCases: getField(toolForm, 'useCases').value,
      verified: getField(toolForm, 'verified').checked,
      featured: getField(toolForm, 'featured').checked,
      sponsored: getField(toolForm, 'sponsored').checked
    };

    try {
      if (activeToolSlug) {
        await requestJson(`/api/admin/tools/${encodeURIComponent(activeToolSlug)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        statsStatus.textContent = 'Tool updated.';
      } else {
        await requestJson(API.adminTools, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        statsStatus.textContent = 'Tool created.';
      }

      statsStatus.classList.remove('error');
      toolForm.reset();
      activeToolSlug = '';
      editorMode.textContent = 'Create new tool';
      await refreshAdmin();
    } catch (error) {
      statsStatus.textContent = error.message;
      statsStatus.classList.add('error');
    }
  });

  document.getElementById('resetToolEditor').addEventListener('click', () => {
    activeToolSlug = '';
    toolForm.reset();
    editorMode.textContent = 'Create new tool';
    statsStatus.textContent = 'Tool editor reset.';
    statsStatus.classList.remove('error');
  });

  await refreshAdmin();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
  } catch (error) {
    setGlobalStatus(error.message, true);
  }
});
