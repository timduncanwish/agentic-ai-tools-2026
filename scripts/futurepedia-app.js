(function bootstrapLegacyFuturepediaApp() {
  const page = document.body && document.body.dataset ? document.body.dataset.page : '';

  const moduleByPage = {
    home: '/scripts/home-page.js',
    directory: '/scripts/directory-page.js',
    submit: '/scripts/submit-page.js',
    admin: '/scripts/admin-page.js',
    courses: '/scripts/courses-page.js',
    creators: '/scripts/creators-page.js',
    category: '/scripts/category-page.js'
  };

  const nextModule = moduleByPage[page];
  if (!nextModule) {
    return;
  }

  import(nextModule).catch((error) => {
    console.error('Legacy loader failed:', error);
  });
})();
