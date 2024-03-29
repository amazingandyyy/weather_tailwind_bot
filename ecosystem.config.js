module.exports = {
  apps : [{
    script: 'index.js',
    watch: '.'
  }],

  deploy : {
    production : {
      ref  : 'origin/main',
      repo : 'amazingandyyy/weather_tailwind_bot',
      path : '.',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
