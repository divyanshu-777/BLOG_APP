const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema({
    Username:
    {
        type: String,
        required: true
    },

    Email:
    {
        type: String,
        required: true,
        unique: true
    },

    Password:
    {
        type: String,
        required: true
    }
});

Schema.pre(
    'save',
    async function(next) {
      const user = this;
      const hash = await bcrypt.hash(this.Password, 10);
      this.Password = hash;
      next();
    }
  );

module.exports = mongoose.model('admin',Schema);