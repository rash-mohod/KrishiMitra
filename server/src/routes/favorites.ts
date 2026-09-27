import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ok, fail } from '../utils/http.js';
const router=Router();
router.use(requireAuth);
router.get('/',async(req:AuthRequest,res)=>{const {data,error}=await supabaseAdmin.from('favorites').select('equipment_id').eq('user_id',req.user!.id);if(error)return fail(res,error.message,500);return ok(res,{favorites:(data??[]).map((x:any)=>x.equipment_id)});});
router.post('/:equipmentId/toggle',async(req:AuthRequest,res)=>{const existing=await supabaseAdmin.from('favorites').select('id').eq('user_id',req.user!.id).eq('equipment_id',req.params.equipmentId).maybeSingle();if(existing.data){await supabaseAdmin.from('favorites').delete().eq('id',existing.data.id);return ok(res,{isFavorite:false});}const {error}=await supabaseAdmin.from('favorites').insert({user_id:req.user!.id,equipment_id:req.params.equipmentId});if(error)return fail(res,error.message,400);return ok(res,{isFavorite:true});});
export default router;
