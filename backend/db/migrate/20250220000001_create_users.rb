# frozen_string_literal: true

class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.integer :points_balance, default: 0, null: false
      t.timestamps
    end
  end
end
