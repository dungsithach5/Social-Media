const express = require('express');
const router = express.Router();

const {
  getAllInterests,
  getInterestById,
  createInterest,
  updateInterest,
  deleteInterest,
  assignUserInterests,
  getPostsByUserInterest,
} = require('../controllers/interest.controller');

router
  .route('/')
  .get(getAllInterests)
  .post(createInterest);

router
  .route('/:id')
  .get(getInterestById)
  .put(updateInterest)
  .delete(deleteInterest);


router.post('/assign/:userId', assignUserInterests);

router.get('/posts/:userId', getPostsByUserInterest);

module.exports = router;
