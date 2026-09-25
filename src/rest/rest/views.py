from bson import ObjectId
from bson.errors import InvalidId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json, os
from pymongo import MongoClient

mongo_uri = os.getenv('MONGO_URI') or (
    'mongodb://' + os.environ['MONGO_HOST'] + ':' + os.environ['MONGO_PORT']
)
db = MongoClient(mongo_uri)['test_db']

class TodoListView(APIView):

    def get(self, request):
        todos = [serialize_todo(todo) for todo in db.todos.find({})]
        return Response({'todos': todos}, status=status.HTTP_200_OK)

    def post(self, request):
        payload = request.data if hasattr(request, 'data') else json.loads(request.body or '{}')
        description = payload.get('description') if isinstance(payload, dict) else None

        if description is None or not str(description).strip():
            return Response({'error': 'Description is required'}, status=status.HTTP_400_BAD_REQUEST)

        todo = {'description': str(description).strip(), 'completed': False}
        result = db.todos.insert_one(todo)
        todo['_id'] = result.inserted_id
        return Response(serialize_todo(todo), status=status.HTTP_201_CREATED)


def serialize_todo(todo):
    return {
        'id': str(todo['_id']),
        'description': todo.get('description', ''),
        'completed': bool(todo.get('completed', False)),
    }


def get_todo_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


class TodoDetailView(APIView):

    def patch(self, request, todo_id):
        object_id = get_todo_id(todo_id)
        if object_id is None:
            return Response({'error': 'Invalid todo id'}, status=status.HTTP_400_BAD_REQUEST)

        updates = {}
        if 'completed' in request.data:
            updates['completed'] = bool(request.data['completed'])
        if 'description' in request.data:
            description = str(request.data['description']).strip()
            if not description:
                return Response({'error': 'Description is required'}, status=status.HTTP_400_BAD_REQUEST)
            updates['description'] = description
        if not updates:
            return Response({'error': 'No updates provided'}, status=status.HTTP_400_BAD_REQUEST)

        result = db.todos.update_one({'_id': object_id}, {'$set': updates})
        todo = db.todos.find_one({'_id': object_id})
        if result.matched_count == 0 or todo is None:
            return Response({'error': 'Todo not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(serialize_todo(todo), status=status.HTTP_200_OK)

    def delete(self, request, todo_id):
        object_id = get_todo_id(todo_id)
        if object_id is None:
            return Response({'error': 'Invalid todo id'}, status=status.HTTP_400_BAD_REQUEST)

        result = db.todos.delete_one({'_id': object_id})
        if result.deleted_count == 0:
            return Response({'error': 'Todo not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

