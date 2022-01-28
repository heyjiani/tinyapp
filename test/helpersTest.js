const { assert } = require('chai');

const { findUserByEmail } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUser = testUsers["userRandomID"];
    
    assert.deepEqual(user, expectedUser);
  });

  it('should return undefined with a non-existent email', () => {
    const user = findUserByEmail("meowmeow@cat.com", testUsers);

    assert.isUndefined(user);
  });
});