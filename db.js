const jwt = require('jsonwebtoken')
const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false
};

const tokenSecret = process.env.JWT

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  console.log("---user by token")
  try {
    const verifiedToken = await jwt.verify(token, process.env.JWT)
    console.log('verified token', verifiedToken)
    const user = await User.findByPk(verifiedToken.userId);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  console.log("---USER.AUTHENTICATE")
  const user = await User.findOne({
    where: {
      username,
      password
    }
  });
  if(user){
    const token = await jwt.sign( {userId: user.id}, tokenSecret)
    console.log('token', token)
    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};
