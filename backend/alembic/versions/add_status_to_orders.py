from alembic import op
import sqlalchemy as sa

revision = 'add_status_orders'
down_revision = 'efcb7cf5f888'  # your existing migration
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('orders', sa.Column('status', sa.String(), nullable=True, server_default='pending'))

def downgrade():
    op.drop_column('orders', 'status')