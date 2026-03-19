import { API, requestJson, setGlobalStatus } from './discovery-core.js';

function getField(form, name) {
  return form.elements.namedItem(name);
}

async function init() {
  const form = document.getElementById('submitToolForm');
  const status = document.getElementById('submitStatus');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Submitting...';
    status.classList.remove('error');

    try {
      await requestJson(API.submissions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: getField(form, 'name').value,
          url: getField(form, 'url').value,
          category: getField(form, 'category').value,
          contactEmail: getField(form, 'contactEmail').value,
          pricingModel: getField(form, 'pricingModel').value,
          notes: getField(form, 'notes').value
        })
      });

      status.textContent = 'Submission received. Editorial review will follow.';
      form.reset();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add('error');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
  } catch (error) {
    setGlobalStatus(error.message, true);
  }
});
