const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`
  SELECT * FROM users
  WHERE email = $1;
  `, [email])
    .then(res => {
      console.log(res.rows);
      return (null || res.rows[0]);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`
    SELECT * FROM users
    WHERE id = $1;
  `, [id])
    .then(res => {
      return null || res.rows[0];
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool.query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `, [user.name, user.email, user.password])
    .then(res => {
      return res.rows[0];
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`
  SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON property_reviews.property_id = properties.id 
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  ORDER BY start_date
  LIMIT $2;
  `, [guest_id, limit]).then(res => {
    return res.rows;
  })
    .catch(err => {
      return 'query error ' + err.stack;
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];

  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) AS average_rating
    FROM properties
    JOIN property_reviews ON property_id = properties.id
  `;
  console.log(options);
  if (options.city || options.owner_id || options.minimum_rating ||
      options.minimum_price_per_night ||
      options.maximum_price_per_night) {
    let isFirst = true;
    if (options.city) {
      queryParams.push(`%${options.city}`);
      queryString += `WHERE city LIKE $${queryParams.length} `;
      isFirst = false;
    }
    if (options.owner_id) {
      if (isFirst) {
        queryParams.push(options.owner_id);
        queryString += `WHERE owner_id = $${queryParams.length} `;
        isFirst = false;
      } else {
        queryParams.push(options.owner_id);
        queryString += `AND owner_id = $${queryParams.length} `;
      }
    }
    if (options.minimum_rating) {
      if (isFirst) {
        queryParams.push(options.minimum_rating);
        queryString += `WHERE rating >= $${queryParams.length} `;
        isFirst = false;
      } else {
        queryParams.push(options.minimum_rating);
        queryString += `AND rating >= $${queryParams.length} `;
      }
    }
    if (options.minimum_price_per_night) {
      if (isFirst) {
        queryParams.push(options.minimum_price_per_night);
        queryString += `WHERE cost_per_night >= $${queryParams.length} `;
        isFirst = false;
      } else {
        queryParams.push(options.minimum_price_per_night);
        queryString += `AND cost_per_night >= $${queryParams.length} `;
      }
    }
    if (options.maximum_price_per_night) {
      if (isFirst) {
        queryParams.push(options.maximum_price_per_night);
        queryString += `WHERE cost_per_night <= $${queryParams.length} `;
        isFirst = false;
      } else {
        queryParams.push(options.maximum_price_per_night);
        queryString += `AND cost_per_night <= $${queryParams.length} `;
      }
    }
  }

  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams)
    .then(res => {
      return res.rows;
    }).catch(err => {
      return 'query error ' + err.stack;
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  return pool.query(`
    INSERT INTO properties (
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      street,
      city,
      province,
      post_code,
      country,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *;
  `, [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ]).then(res => {
    console.log(res.rows[0]);
    return res.rows[0];
  });
};
exports.addProperty = addProperty;
