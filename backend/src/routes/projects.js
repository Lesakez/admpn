// backend/src/routes/projects.js

const express = require('express');
const projectController = require('../controllers/projectController');
const { validateProject, validateProjectUpdate } = require('../validators/projectValidator');

const router = express.Router();

// GET /api/projects - получить список проектов с пагинацией и статистикой
router.get('/', projectController.getProjects);

// GET /api/projects/stats - получить общую статистику по всем проектам
router.get('/stats', projectController.getProjectsStats);

// GET /api/projects/:id - получить проект по ID с детальной статистикой
router.get('/:id', projectController.getProject);

// POST /api/projects - создать новый проект
router.post('/', validateProject, projectController.createProject);

// PUT /api/projects/:id - обновить проект
router.put('/:id', validateProjectUpdate, projectController.updateProject);

// DELETE /api/projects/:id - удалить проект
router.delete('/:id', projectController.deleteProject);

// POST /api/projects/:id/assign - массово назначить ресурсы проекту
router.post('/:id/assign', projectController.assignResources);

// POST /api/projects/:id/unassign - отвязать ресурсы от проекта
router.post('/:id/unassign', projectController.unassignResources);

module.exports = router;