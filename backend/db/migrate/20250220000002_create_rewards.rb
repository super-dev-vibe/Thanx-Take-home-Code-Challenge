# frozen_string_literal: true

class CreateRewards < ActiveRecord::Migration[7.2]
  def change
    create_table :rewards do |t|
      t.string :name, null: false
      t.integer :points_cost, null: false
      t.text :description
      t.timestamps
    end
  end
end
