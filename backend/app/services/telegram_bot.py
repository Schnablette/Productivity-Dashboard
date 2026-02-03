"""Telegram bot service for mobile todo input."""

import re
import asyncio
import logging
from telegram import Update, Bot
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

from ..config import get_settings
from ..database import SessionLocal
from ..models import Todo

settings = get_settings()
logger = logging.getLogger(__name__)


class TelegramBotService:
    """Service for handling Telegram bot interactions."""

    def __init__(self):
        self.application: Application | None = None
        self.bot: Bot | None = None
        self._running = False

    def is_authorized(self, user_id: int) -> bool:
        """Check if a user is authorized to use the bot."""
        return user_id in settings.authorized_user_ids

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        user = update.effective_user
        if not self.is_authorized(user.id):
            await update.message.reply_text(
                f"Sorry, you're not authorized to use this bot.\n"
                f"Your Telegram ID is: {user.id}\n"
                f"Add this ID to AUTHORIZED_USERS in your .env file."
            )
            return

        await update.message.reply_text(
            f"Hello {user.first_name}! I'm your household todo bot.\n\n"
            "Commands:\n"
            "/add <task> - Add a new todo\n"
            "/list - Show all pending todos\n"
            "/all - Show all todos (including completed)\n"
            "/done <id> - Mark a todo as complete\n"
            "/delete <id> - Delete a todo\n"
            "/help - Show this message\n\n"
            "You can also type naturally:\n"
            "'add todo: buy groceries'\n"
            "'todo buy milk'"
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command."""
        await self.start_command(update, context)

    async def add_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /add command."""
        user = update.effective_user
        if not self.is_authorized(user.id):
            await update.message.reply_text("You're not authorized to use this bot.")
            return

        if not context.args:
            await update.message.reply_text("Please provide a task. Example: /add Buy groceries")
            return

        title = " ".join(context.args)
        todo = self._create_todo(title, user.username or str(user.id))

        await update.message.reply_text(f"Added todo #{todo.id}: {todo.title}")

    async def list_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /list command - show pending todos."""
        user = update.effective_user
        if not self.is_authorized(user.id):
            await update.message.reply_text("You're not authorized to use this bot.")
            return

        todos = self._get_todos(completed=False)

        if not todos:
            await update.message.reply_text("No pending todos!")
            return

        message = "Pending todos:\n\n"
        for todo in todos:
            message += f"#{todo.id} - {todo.title}\n"

        await update.message.reply_text(message)

    async def all_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /all command - show all todos."""
        user = update.effective_user
        if not self.is_authorized(user.id):
            await update.message.reply_text("You're not authorized to use this bot.")
            return

        todos = self._get_todos()

        if not todos:
            await update.message.reply_text("No todos found!")
            return

        message = "All todos:\n\n"
        for todo in todos:
            status = "Completed" if todo.completed else "Pending"
            message += f"#{todo.id} [{status}] - {todo.title}\n"

        await update.message.reply_text(message)

    async def done_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /done command."""
        user = update.effective_user
        if not self.is_authorized(user.id):
            await update.message.reply_text("You're not authorized to use this bot.")
            return

        if not context.args:
            await update.message.reply_text("Please provide a todo ID. Example: /done 1")
            return

        try:
            todo_id = int(context.args[0])
        except ValueError:
            await update.message.reply_text("Invalid ID. Please provide a number.")
            return

        todo = self._complete_todo(todo_id)
        if todo:
            await update.message.reply_text(f"Completed: {todo.title}")
        else:
            await update.message.reply_text(f"Todo #{todo_id} not found.")

    async def delete_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /delete command."""
        user = update.effective_user
        if not self.is_authorized(user.id):
            await update.message.reply_text("You're not authorized to use this bot.")
            return

        if not context.args:
            await update.message.reply_text("Please provide a todo ID. Example: /delete 1")
            return

        try:
            todo_id = int(context.args[0])
        except ValueError:
            await update.message.reply_text("Invalid ID. Please provide a number.")
            return

        if self._delete_todo(todo_id):
            await update.message.reply_text(f"Deleted todo #{todo_id}")
        else:
            await update.message.reply_text(f"Todo #{todo_id} not found.")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle natural language messages."""
        user = update.effective_user
        if not self.is_authorized(user.id):
            return

        text = update.message.text.lower().strip()

        # Patterns for adding todos
        add_patterns = [
            r"^add todo:?\s*(.+)$",
            r"^todo:?\s*(.+)$",
            r"^add:?\s*(.+)$",
            r"^new todo:?\s*(.+)$",
        ]

        for pattern in add_patterns:
            match = re.match(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                if title:
                    todo = self._create_todo(title, user.username or str(user.id))
                    await update.message.reply_text(f"Added todo #{todo.id}: {todo.title}")
                    return

    def _create_todo(self, title: str, created_by: str) -> Todo:
        """Create a new todo in the database."""
        db = SessionLocal()
        try:
            todo = Todo(title=title, created_by=created_by)
            db.add(todo)
            db.commit()
            db.refresh(todo)
            return todo
        finally:
            db.close()

    def _get_todos(self, completed: bool | None = None) -> list[Todo]:
        """Get todos from the database."""
        db = SessionLocal()
        try:
            query = db.query(Todo)
            if completed is not None:
                query = query.filter(Todo.completed == completed)
            return query.order_by(Todo.created_at.desc()).all()
        finally:
            db.close()

    def _complete_todo(self, todo_id: int) -> Todo | None:
        """Mark a todo as complete."""
        db = SessionLocal()
        try:
            todo = db.query(Todo).filter(Todo.id == todo_id).first()
            if todo:
                todo.completed = True
                db.commit()
                db.refresh(todo)
            return todo
        finally:
            db.close()

    def _delete_todo(self, todo_id: int) -> bool:
        """Delete a todo."""
        db = SessionLocal()
        try:
            todo = db.query(Todo).filter(Todo.id == todo_id).first()
            if todo:
                db.delete(todo)
                db.commit()
                return True
            return False
        finally:
            db.close()

    async def start(self):
        """Start the Telegram bot."""
        if not settings.telegram_bot_token:
            logger.warning("Telegram bot token not configured. Bot will not start.")
            return

        self.application = Application.builder().token(settings.telegram_bot_token).build()

        # Register handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("add", self.add_command))
        self.application.add_handler(CommandHandler("list", self.list_command))
        self.application.add_handler(CommandHandler("all", self.all_command))
        self.application.add_handler(CommandHandler("done", self.done_command))
        self.application.add_handler(CommandHandler("delete", self.delete_command))
        self.application.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message)
        )

        # Start polling
        self._running = True
        logger.info("Starting Telegram bot...")
        await self.application.initialize()
        await self.application.start()
        await self.application.updater.start_polling(drop_pending_updates=True)

    async def stop(self):
        """Stop the Telegram bot."""
        if self.application and self._running:
            self._running = False
            await self.application.updater.stop()
            await self.application.stop()
            await self.application.shutdown()
            logger.info("Telegram bot stopped.")


# Global bot instance
telegram_bot = TelegramBotService()
