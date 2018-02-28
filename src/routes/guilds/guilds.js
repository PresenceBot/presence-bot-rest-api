const express = require('express');
const router = express.Router();

const guildService = require('../../services/guild-service.js');

router.get('/test', (req, res) => {
    res.send({time: +new Date()});
});

router.get('/:id/activity', (req, res) => {
    const {id} = req.params;
    guildService.getActivity(id).then(data => {
        res.send(data);
    });
});

module.exports = router;
