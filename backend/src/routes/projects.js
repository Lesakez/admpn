const express = require('express');
const projectController = require('../controllers/projectController');
const { validateProject } = require('../validators/projectValidator');

const router = express.Router();

// GET /api/projects - получить список проектов
router.get('/', projectController.getProjects);

// GET /api/projects/:id - получить проект по ID
router.get('/:id', projectController.getProject);

// POST /api/projects - создать новый проект
router.post('/', validateProject, projectController.createProject);

// PUT /api/projects/:id - обновить проект
router.put('/:id', validateProject, projectController.updateProject);

// DELETE /api/projects/:id - удалить проект
router.delete('/:id', projectController.deleteProject);

module.exports = router;