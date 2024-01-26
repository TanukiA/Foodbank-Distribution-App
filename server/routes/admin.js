const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

//Static Files
router.use('/css', express.static(__dirname + 'public/css'));
router.use('/js', express.static(__dirname + 'public/js'));
router.use('/img', express.static(__dirname + 'public/img'));

//Get Respond
router.get('/adminBrowse', adminController.browse);

router.get('/request', adminController.viewRequest);
router.get('/userlist', adminController.viewUserlist);

router.get('/adminHome', adminController.adminHome);
router.get('/report', adminController.report);

//Post
router.post('/deleteFoodBank', adminController.deleteFoodBank);
router.post('/adminSearch', adminController.filter);

router.post('/approveRequest', adminController.approveRequest);
router.post('/declineRequest', adminController.declineRequest);
router.post('/deleteUser', adminController.deleteUser);

module.exports = router;